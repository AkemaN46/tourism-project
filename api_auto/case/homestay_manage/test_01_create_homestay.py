import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


create_datas = read_yaml("homestay_manage/homestay.yaml", "create_homestay")


@allure.epic("民宿预订系统")
@allure.feature("后台民宿管理")
class TestCreateHomestay:

    @allure.story("创建民宿")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", create_datas)
    def test_create_homestay(self, admin, homestay_cleanup, title, data):
        url = BASE_URL + data["url"]
        admin.request(method=data["method"], url=url, json=data["json_data"])
        result = admin.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
        if result == 200:
            homestay_cleanup.append(admin.response.json()["data"]["id"])
