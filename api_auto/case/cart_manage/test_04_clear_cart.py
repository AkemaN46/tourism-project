import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


clear_datas = read_yaml("cart_manage/cart.yaml", "clear_cart")


@allure.epic("民宿预订系统")
@allure.feature("购物车管理")
class TestClearCart:

    @allure.story("清空购物车")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", clear_datas)
    def test_clear_cart(self, user, cart_item, title, data):
        cart_item(data["add_data"])
        url = BASE_URL + data["url"]
        user.request(method=data["method"], url=url)
        result = user.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
