import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


update_datas = read_yaml("cart_manage/cart.yaml", "update_cart")


@allure.epic("民宿预订系统")
@allure.feature("购物车管理")
class TestUpdateCart:

    @allure.story("修改购物车日期")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", update_datas)
    def test_update_cart(self, user, cart_item, title, data):
        cart_id = cart_item(data["add_data"])
        url = BASE_URL + data["url"].format(id=cart_id)
        user.request(method=data["method"], url=url, json=data["json_data"])
        result = user.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
