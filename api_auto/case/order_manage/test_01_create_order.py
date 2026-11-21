import allure
import pytest
from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


create_datas = read_yaml("order_manage/order.yaml", "create_order")


@allure.epic("民宿预订系统")
@allure.feature("订单管理")
class TestCreateOrder:

    @allure.story("创建单个订单")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", create_datas)
    def test_create_order(self, user, order_cleanup, title, data):
        url = BASE_URL + data["url"]
        user.request(method=data["method"], url=url, json=data["json_data"])
        result = user.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
        if result == 200:
            order_cleanup.append(user.response.json()["data"]["id"])
