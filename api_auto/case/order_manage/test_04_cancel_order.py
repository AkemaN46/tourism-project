import allure
import pytest
from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


cancel_datas = read_yaml("order_manage/order.yaml", "cancel_order")


@allure.epic("民宿预订系统")
@allure.feature("订单管理")
class TestCancelOrder:

    @allure.story("取消订单")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", cancel_datas)
    def test_cancel_order(self, user, pending_order, title, data):
        order_id = pending_order(data["order_data"])
        url = BASE_URL + data["url"].format(id=order_id)
        user.request(method=data["method"], url=url, json=data["json_data"])
        result = user.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
