import allure
import pytest
from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


complete_datas = read_yaml("order_manage/order.yaml", "complete_order")


@allure.epic("民宿预订系统")
@allure.feature("订单管理")
class TestCompleteOrder:

    @allure.story("后台办理入住和完成订单")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", complete_datas)
    def test_check_in_and_complete_order(self, admin, paid_order, title, data):
        order_id = paid_order(data["order_data"])
        for status in data["statuses"]:
            url = BASE_URL + data["url"].format(id=order_id)
            admin.request(method=data["method"], url=url, json={"status": status})
            result = admin.response.json()["code"]
            log.info(f"业务状态码：{result}")
            expect = data["expect"]["code"]
            assert expect == result
