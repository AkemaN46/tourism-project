import base64
import json
import os
import time

from api.base_api import BaseAPI
from tools.get_log import log

# 微信 code 是一次性的，但换来的 token 可复用 7 天；缓存起来就不用每次手动换 code
CACHE_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                          "data", "token_cache.json")


def _cache_get():
    """缓存 token 未过期就返回，否则 None（读不到 / 解不出 exp 一律当作已过期）"""
    try:
        token = json.load(open(CACHE_PATH, encoding="utf-8"))["token"]
        payload = token.split(".")[1]
        payload += "=" * (-len(payload) % 4)
        if json.loads(base64.urlsafe_b64decode(payload))["exp"] > time.time() + 60:
            return token
    except Exception:
        pass
    return None


class TokenAPI(BaseAPI):

    # 获取微信 token
    def wx_token(self,url,wx_code):
        # 优先复用缓存 token，命中就不发 wxlogin、也不消耗 code
        self.token = _cache_get()
        if self.token:
            log.info("命中缓存 token，跳过微信登录")
            return self.token
        json_data = {
            "code": wx_code,
            "agreed": True
        }
        # 判断原来是否存在token，存在则删除
        if hasattr(self, "token"):
            del self.token
        self.request(method="post", url=url, json=json_data)
        try:
            self.token = self.response.json()["data"]["token"]
            # 登录成功，写入缓存供后续运行复用
            try:
                json.dump({"token": self.token}, open(CACHE_PATH, "w", encoding="utf-8"))
            except OSError as e:
                log.warning(f"token 缓存写入失败（不影响本次运行）：{e}")
            # 重新返回一个新的token
            return self.token
        except:
            log.warning(f"token获取失败，响应信息：{self.response.text}")
            raise

    # 获取管理员 token
    def admin_token(self,url,username,password):
        params = {
            "username": username,
            "password": password
        }
        # 判断原来是否存在token，存在则删除
        if hasattr(self, "token"):
            del self.token
        self.request(method="post", url=url, params=params)
        try:
            self.token = self.response.json()["data"]["token"]
            # 重新返回一个新的token
            return self.token
        except:
            log.warning(f"token获取失败，响应信息：{self.response.text}")
            raise
