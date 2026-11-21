import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


update_datas = read_yaml("user_manage/user.yaml", "update_user")


@allure.epic("民宿预订系统")
@allure.feature("用户管理")
class TestUpdateUser:

    @allure.story("修改当前用户资料")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", update_datas)
    def test_update_user(self, user, title, data):
        url = BASE_URL + data["url"]
        user.request(method=data["method"], url=url, json=data["json_data"])
        result = user.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
