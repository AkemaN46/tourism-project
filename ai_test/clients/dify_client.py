"""Dify Workflow API 客户端，仅负责调用被测应用。"""

from __future__ import annotations


import time
from typing import Any

import requests

from config import (
    DIFY_API_KEY,
    DIFY_API_URL,
    DIFY_TIMEOUT,
    DIFY_USER,
    MAX_RETRIES,
    RETRY_INTERVAL,
)


def clean_answer(answer: Any) -> str:
    """清理 Dify 返回的回答文本。

    将 ``None`` 转为空字符串、去掉首尾空格；如果回答中包含
    ``</think>``，只保留最后一个结束标签之后的最终业务回答。

    Args:
        answer: Dify 响应中的原始 answer 值。

    Returns:
        可以交给后续评测器使用的纯文本回答。
    """
    if answer is None:
        return ""

    cleaned = str(answer).strip()
    think_end_tag = "</think>"
    if think_end_tag in cleaned:
        cleaned = cleaned.rsplit(think_end_tag, 1)[1].strip()
    return cleaned


def _safe_error_message(error: Exception) -> str:
    """把异常转换成可读文本，并替换其中可能出现的 Dify API Key。"""
    message = f"{type(error).__name__}: {error}"
    if DIFY_API_KEY:
        message = message.replace(DIFY_API_KEY, "***")
    return message


def _extract_answer(response_data: Any) -> str:
    """从 Dify Workflow 响应的 ``data.outputs.answer`` 中提取回答。

    本函数同时校验响应层级、answer 类型和清理后的回答是否为空。
    响应不符合约定时抛出 ``ValueError``，由 ``call_dify`` 统一重试。
    """
    if not isinstance(response_data, dict):
        raise ValueError("Dify响应不是JSON对象")

    data = response_data.get("data")
    if not isinstance(data, dict):
        raise ValueError("Dify响应中缺少data对象")

    outputs = data.get("outputs")
    if not isinstance(outputs, dict):
        raise ValueError("Dify响应中缺少data.outputs对象")

    if "answer" not in outputs:
        raise ValueError(
            f"Dify响应中不存在answer字段，"
            f"实际outputs字段：{list(outputs.keys())}"
        )

    raw_answer = outputs.get("answer")

    if raw_answer is not None and not isinstance(raw_answer, str):
        raise ValueError(
            f"data.outputs.answer类型错误：{type(raw_answer).__name__}"
        )

    answer = clean_answer(raw_answer)

    if not answer:
        raise ValueError(
            f"Dify响应中的answer为空，实际outputs：{outputs}"
        )

    return answer


def call_dify(question: str) -> dict[str, Any]:
    """通过 requests 调用被测 Dify Workflow API。

    函数负责构造认证头和请求体、记录响应时间、校验响应结构，并按配置
    进行重试。所有调用异常都会转换为统一结果，不会向上抛出并中断批次。

    Args:
        question: 当前测试用例要发送给民宿问答助手的问题。

    Returns:
        包含 success、answer、error、response_time 的调用结果字典。
    """
    if not DIFY_API_KEY.strip():
        return {
            "success": False,
            "answer": "",
            "error": "DIFY_API_KEY未配置",
            "response_time": 0,
        }
    if not DIFY_API_URL.strip():
        return {
            "success": False,
            "answer": "",
            "error": "DIFY_API_URL未配置",
            "response_time": 0,
        }

    headers = {
        "Authorization": f"Bearer {DIFY_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {
        "inputs": {"query": question},
        "response_mode": "blocking",
        "user": DIFY_USER,
    }

    last_error = "未知错误"
    retry_count = max(1, MAX_RETRIES)

    for attempt in range(1, retry_count + 1):
        started_at = time.perf_counter()
        try:
            response = requests.post(
                DIFY_API_URL,
                headers=headers,
                json=payload,
                timeout=DIFY_TIMEOUT,
            )
            response.raise_for_status()
            answer = _extract_answer(response.json())
            response_time = round(time.perf_counter() - started_at, 3)
            return {
                "success": True,
                "answer": answer,
                "error": "",
                "response_time": response_time,
            }
        except (requests.RequestException, ValueError, TypeError, KeyError) as error:
            last_error = _safe_error_message(error)
            if attempt < retry_count:
                time.sleep(RETRY_INTERVAL)

    return {
        "success": False,
        "answer": "",
        "error": last_error,
        "response_time": 0,
    }
