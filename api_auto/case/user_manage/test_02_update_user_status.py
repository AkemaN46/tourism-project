import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


status_datas = read_yaml("user_manage/user.yaml", "update_user_status")


@allure.epic("民宿预订系统")
@allure.feature("用户管理")
class TestUpdateUserStatus:

    @allure.story("管理员启用和禁用用户")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", status_datas)
    def test_update_user_status(self, admin, restore_user_status, title, data):
        url = BASE_URL + data["url"].format(id=restore_user_status)
        admin.request(method=data["method"], url=url, json=data["json_data"])
        result = admin.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
