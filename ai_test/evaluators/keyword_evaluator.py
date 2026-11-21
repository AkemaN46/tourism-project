"""确定性关键词评测。"""

from __future__ import annotations

from typing import Any


def split_words(text: Any) -> list[str]:
    """把 CSV 中以 ``|`` 分隔的配置文本转换成关键词列表。

    ``None`` 和空字符串会得到空列表；每个关键词都会去掉首尾空格，
    连续分隔符产生的空项会被删除。本函数也用于解析 dimension 字段。
    """
    if text is None:
        return []
    return [word.strip() for word in str(text).split("|") if word.strip()]


def evaluate_keywords(
    answer: str,
    must_have: str | None,
    must_not_have: str | None,
) -> dict[str, Any]:
    """对实际回答执行确定性的关键词检查。

    必须词需要全部出现在回答中，禁止词则一个也不能出现。两个规则字段
    都允许为空。返回是否通过、缺失的必须词和命中的禁止词。
    """
    answer = answer or ""
    required_words = split_words(must_have)
    prohibited_words = split_words(must_not_have)

    missing_words = [word for word in required_words if word not in answer]
    forbidden_words = [word for word in prohibited_words if word in answer]

    return {
        "passed": not missing_words and not forbidden_words,
        "missing_words": missing_words,
        "forbidden_words": forbidden_words,
    }
