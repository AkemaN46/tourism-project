import requests
from tools.get_log import log

class BaseAPI:

    def request(self,method,url,**kwargs):
        try:
            # 判断self中是否存在token属性，如果存在则在请求参数中添加token
            if hasattr(self,'token'):
                self.response = requests.request(method=method, url=url, headers={"token": self.token},**kwargs)
            else:
                self.response=requests.request(method=method,url=url,**kwargs)
        except:
            log.warning("接口请求失败，请检查请求信息！！！")
            raise