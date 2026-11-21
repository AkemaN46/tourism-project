"""AI 批量评测框架的统一配置。"""

import os
from pathlib import Path

from dotenv import load_dotenv


# 固定从 ai_test/.env 加载本地密钥，不依赖程序启动时的工作目录。
ENV_FILE = Path(__file__).resolve().parent / ".env"
load_dotenv(ENV_FILE)


# Dify 配置
DIFY_API_KEY = os.getenv("DIFY_API_KEY", "")
DIFY_API_URL = "https://api.dify.ai/v1/workflows/run"
DIFY_USER = "ackerman"

# Judge 模型配置（OpenAI Compatible API）
JUDGE_API_KEY = os.getenv("JUDGE_API_KEY", "")
JUDGE_API_URL = "https://api.deepseek.com"
JUDGE_MODEL = "deepseek-flash"

# 请求配置
DIFY_TIMEOUT = 30
JUDGE_TIMEOUT = 120
MAX_RETRIES = 3
RETRY_INTERVAL = 2

# 评委通过分数
JUDGE_PASS_SCORE = 80
