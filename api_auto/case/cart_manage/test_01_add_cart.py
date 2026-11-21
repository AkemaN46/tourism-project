import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


add_datas = read_yaml("cart_manage/cart.yaml", "add_cart")


@allure.epic("民宿预订系统")
@allure.feature("购物车管理")
class TestAddCart:

    @allure.story("加入购物车")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", add_datas)
    def test_add_cart(self, user, cart_cleanup, title, data):
        url = BASE_URL + data["url"]
        user.request(method=data["method"], url=url, json=data["json_data"])
        result = user.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
        if result == 200:
            cart_cleanup.append(user.response.json()["data"]["id"])
