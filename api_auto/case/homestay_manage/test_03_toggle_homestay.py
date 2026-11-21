import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


toggle_datas = read_yaml("homestay_manage/homestay.yaml", "toggle_homestay")


@allure.epic("民宿预订系统")
@allure.feature("后台民宿管理")
class TestToggleHomestay:

    @allure.story("上下架民宿")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", toggle_datas)
    def test_toggle_homestay(self, admin, homestay_item, title, data):
        homestay_id = homestay_item(data["create_data"])
        for _ in range(2):
            url = BASE_URL + data["url"].format(id=homestay_id)
            admin.request(method=data["method"], url=url)
            result = admin.response.json()["code"]
            log.info(f"业务状态码：{result}")
            expect = data["expect"]["code"]
            assert expect == result
