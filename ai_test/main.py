"""AI 应用批量评测入口。"""

from __future__ import annotations


import csv
import json
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from clients.dify_client import call_dify
from evaluators.keyword_evaluator import evaluate_keywords, split_words
from evaluators.llm_judge import llm_judge


PROJECT_ROOT = Path(__file__).resolve().parent
CASES_PATH = PROJECT_ROOT / "data" / "homestay_cases.csv"
REPORT_PATH = PROJECT_ROOT / "reports" / "result.json"

REQUIRED_FIELDS = [
    "case_id",
    "category",
    "difficulty",
    "question",
    "expected",
    "must_have",
    "must_not_have",
    "dimension",
]
RESULT_NAMES = ("PASS", "REVIEW", "FAIL", "ERROR")


def _current_time() -> str:
    """返回报告使用的当前本地时间，格式为 ``YYYY-MM-DD HH:MM:SS``。"""
    return datetime.now().strftime("%Y-%m-%d %H:%M:%S")


def _text(value: Any) -> str:
    """把任意字段安全转换为去除首尾空格的字符串，None 转为空字符串。"""
    return "" if value is None else str(value).strip()


def load_cases(csv_path: Path = CASES_PATH) -> list[dict[str, str]]:
    """读取测试集 CSV，并校验文件和必要字段。

    路径不存在、不是文件、没有表头或缺少必要字段时抛出明确异常。
    只有表头而没有数据行属于合法空测试集，会返回空列表。
    """
    if not csv_path.exists():
        raise FileNotFoundError(f"测试集不存在：{csv_path}")
    if not csv_path.is_file():
        raise ValueError(f"测试集路径不是文件：{csv_path}")

    with csv_path.open("r", encoding="utf-8-sig", newline="") as csv_file:
        reader = csv.DictReader(csv_file)
        if reader.fieldnames is None:
            raise ValueError("测试集为空或缺少CSV表头")

        missing_fields = [
            field for field in REQUIRED_FIELDS if field not in reader.fieldnames
        ]
        if missing_fields:
            raise ValueError(f"CSV缺少必要字段：{', '.join(missing_fields)}")

        return [
            {field: _text(row.get(field)) for field in REQUIRED_FIELDS}
            for row in reader
        ]


def _not_executed_keyword_result() -> dict[str, Any]:
    """生成“关键词评测未执行”时使用的默认结果结构。"""
    return {"passed": False, "missing_words": [], "forbidden_words": []}


def _not_executed_judge_result(reason: str) -> dict[str, Any]:
    """生成“Judge 未执行”时使用的默认结果，并记录未执行原因。"""
    return {"score": 0, "passed": False, "reason": reason, "risk": ""}


def _public_dify_result(dify_result: dict[str, Any]) -> dict[str, Any]:
    """提取适合写入报告的 Dify 调用信息。

    报告只保留调用状态、响应时间和错误，不重复存储 answer，也不会存储
    API Key、Authorization 等认证信息。
    """
    return {
        "success": bool(dify_result.get("success")),
        "response_time": dify_result.get("response_time", 0),
        "error": _text(dify_result.get("error")),
    }


def _base_detail(case: dict[str, str], run_time: str) -> dict[str, Any]:
    """根据 CSV 用例创建一条完整的报告明细初始结构。

    初始状态采用 ERROR/DIFY_ERROR，后续只有各阶段成功执行后才会被真实
    结果覆盖，因此中途失败也能得到字段完整、可序列化的报告记录。
    """
    return {
        "case_id": case["case_id"],
        "category": case["category"],
        "difficulty": case["difficulty"],
        "dimension": split_words(case["dimension"]),
        "question": case["question"],
        "expected": case["expected"],
        "actual_answer": "",
        "dify_result": {
            "success": False,
            "response_time": 0,
            "error": "",
        },
        "keyword_result": _not_executed_keyword_result(),
        "judge_result": _not_executed_judge_result("未执行"),
        "final_result": "ERROR",
        "review_reason": "DIFY_ERROR",
        "run_time": run_time,
    }


def _combine_results(
    keyword_result: dict[str, Any], judge_result: dict[str, Any]
) -> tuple[str, str]:
    """综合关键词评测和 Judge 评测，返回最终状态与复核原因。

    两者都通过为 PASS；只有一个通过为 REVIEW；都不通过为 FAIL；
    Judge 自身异常固定为 REVIEW/JUDGE_ERROR，绝不会误判为 PASS。
    """
    if judge_result.get("risk") == "JUDGE_ERROR":
        return "REVIEW", "JUDGE_ERROR"

    keyword_passed = keyword_result.get("passed") is True
    judge_passed = judge_result.get("passed") is True

    if keyword_passed and judge_passed:
        return "PASS", ""
    if not keyword_passed and judge_passed:
        return "REVIEW", "KEYWORD_FAILED"
    if keyword_passed and not judge_passed:
        return "REVIEW", "JUDGE_FAILED"
    return "FAIL", "KEYWORD_AND_JUDGE_CONFLICT"


def evaluate_case(case: dict[str, str]) -> dict[str, Any]:
    """执行一条测试用例的完整评测链路。

    依次检查问题、调用 Dify、执行关键词评测、调用 LLM Judge，并组合最终
    状态。Dify 失败或问题为空时停止本条的后续评分，并返回 ERROR 明细。
    """
    run_time = _current_time()
    detail = _base_detail(case, run_time)
    question = case["question"]

    if not question:
        detail["dify_result"]["error"] = "测试用例question为空"
        detail["judge_result"] = _not_executed_judge_result(
            "未执行：测试用例question为空"
        )
        return detail

    dify_result = call_dify(question)
    detail["dify_result"] = _public_dify_result(dify_result)

    if not dify_result.get("success"):
        detail["judge_result"] = _not_executed_judge_result(
            "未执行：Dify接口调用失败"
        )
        return detail

    actual_answer = _text(dify_result.get("answer"))
    if not actual_answer:
        detail["dify_result"] = {
            "success": False,
            "response_time": dify_result.get("response_time", 0),
            "error": "Dify回答为空",
        }
        detail["judge_result"] = _not_executed_judge_result(
            "未执行：Dify回答为空"
        )
        return detail

    detail["actual_answer"] = actual_answer
    keyword_result = evaluate_keywords(
        actual_answer,
        case["must_have"],
        case["must_not_have"],
    )
    judge_result = llm_judge(
        question,
        case["expected"],
        actual_answer,
        category=case["category"],
        dimension=case["dimension"],
    )
    final_result, review_reason = _combine_results(keyword_result, judge_result)

    detail["keyword_result"] = keyword_result
    detail["judge_result"] = judge_result
    detail["final_result"] = final_result
    detail["review_reason"] = review_reason
    return detail


def _unexpected_error_detail(
    case: dict[str, str], error: Exception
) -> dict[str, Any]:
    """把未预期的单条用例异常转换为 ERROR 报告明细，供批次继续运行。"""
    detail = _base_detail(case, _current_time())
    detail["dify_result"]["error"] = (
        f"用例执行异常：{type(error).__name__}: {error}"
    )
    detail["judge_result"] = _not_executed_judge_result(
        "未执行：用例发生未预期异常"
    )
    return detail


def build_report(details: list[dict[str, Any]], run_time: str) -> dict[str, Any]:
    """根据全部用例明细构建最终报告对象。

    统计总数、各状态数量和通过率，并整理 REVIEW、FAIL 以及 risk 非空的
    高风险用例列表。JUDGE_ERROR 也会保留在高风险列表中，但可通过它固定
    的 risk 值与真实业务风险区分。
    """
    counts = {name: 0 for name in RESULT_NAMES}

    for detail in details:
        result_name = detail["final_result"]
        counts[result_name] += 1

    total = len(details)
    pass_rate = round(counts["PASS"] / total * 100, 2) if total else 0.0

    return {
        "summary": {
            "total": total,
            "pass": counts["PASS"],
            "review": counts["REVIEW"],
            "fail": counts["FAIL"],
            "error": counts["ERROR"],
            "pass_rate": pass_rate,
            "run_time": run_time,
        },
        "details": details,
        "review_cases": [
            detail for detail in details if detail["final_result"] == "REVIEW"
        ],
        "failed_cases": [
            detail for detail in details if detail["final_result"] == "FAIL"
        ],
        "high_risk_cases": [
            detail
            for detail in details
            if _text(detail.get("judge_result", {}).get("risk"))
        ],
    }


def write_report(report: dict[str, Any], report_path: Path = REPORT_PATH) -> None:
    """自动创建报告目录，并以 UTF-8、中文不转义的格式写入 JSON。"""
    report_path.parent.mkdir(parents=True, exist_ok=True)
    with report_path.open("w", encoding="utf-8") as report_file:
        json.dump(report, report_file, ensure_ascii=False, indent=2)


def run_evaluation(
    csv_path: Path = CASES_PATH, report_path: Path = REPORT_PATH
) -> dict[str, Any]:
    """运行一次完整的批量评测。

    读取 CSV 后逐条调用 ``evaluate_case``；任何未被下层处理的单条异常
    都会转为 ERROR 明细并继续下一条。最后汇总并写入 result.json。
    """
    batch_run_time = _current_time()
    cases = load_cases(csv_path)
    details: list[dict[str, Any]] = []

    for case in cases:
        try:
            details.append(evaluate_case(case))
        except Exception as error:  # 批次级兜底，确保继续执行下一条。
            details.append(_unexpected_error_detail(case, error))

    report = build_report(details, batch_run_time)
    write_report(report, report_path)
    return report


def print_summary(report: dict[str, Any], report_path: Path = REPORT_PATH) -> None:
    """在控制台输出本次批量评测的数量、通过率和报告路径。"""
    summary = report["summary"]
    print("================ AI批量评测完成 ================")
    print(f"总用例数：{summary['total']}")
    print(f"PASS：{summary['pass']}")
    print(f"REVIEW：{summary['review']}")
    print(f"FAIL：{summary['fail']}")
    print(f"ERROR：{summary['error']}")
    print(f"通过率：{summary['pass_rate']}%")
    print(f"报告路径：{report_path.resolve()}")


def main() -> int:
    """程序入口：配置终端编码、运行批次、打印结果并返回进程退出码。

    正常完成返回 0；CSV 读取、字段校验或报告写入等批次级错误返回 1。
    """
    # Windows 终端可能沿用旧代码页，显式使用 UTF-8 避免中文输出乱码。
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if hasattr(sys.stderr, "reconfigure"):
        sys.stderr.reconfigure(encoding="utf-8")

    try:
        report = run_evaluation()
    except (OSError, ValueError, TypeError, csv.Error) as error:
        print("================ AI批量评测失败 ================")
        print(f"错误：{type(error).__name__}: {error}")
        return 1

    print_summary(report)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
