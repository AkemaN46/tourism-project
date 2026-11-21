"""复制为 config.py 后填写本机测试配置；config.py 不进入 Git。"""
import os

BASE_URL = os.getenv("TEST_BASE_URL", "http://127.0.0.1:8082")
wx_login_url = BASE_URL + "/user/wxlogin"
wx_code = os.getenv("WX_LOGIN_CODE", "")
admin_login_url = BASE_URL + "/api/admin/login"
admin_username = os.getenv("TEST_ADMIN_USERNAME", "admin")
admin_password = os.getenv("TEST_ADMIN_PASSWORD", "")
