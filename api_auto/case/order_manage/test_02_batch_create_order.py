import allure
import pytest
from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


batch_datas = read_yaml("order_manage/order.yaml", "batch_create")


@allure.epic("民宿预订系统")
@allure.feature("订单管理")
class TestBatchCreateOrder:

    @allure.story("批量创建订单")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", batch_datas)
    def test_batch_create_order(self, user, order_cleanup, title, data):
        url = BASE_URL + data["url"]
        user.request(method=data["method"], url=url, json=data["json_data"])
        result = user.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
        if result == 200:
            order_cleanup.extend(item["id"] for item in user.response.json()["data"])
