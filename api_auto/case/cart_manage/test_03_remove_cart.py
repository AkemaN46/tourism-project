import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


remove_datas = read_yaml("cart_manage/cart.yaml", "remove_cart")


@allure.epic("民宿预订系统")
@allure.feature("购物车管理")
class TestRemoveCart:

    @allure.story("删除购物车项")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", remove_datas)
    def test_remove_cart(self, user, cart_item, title, data):
        cart_id = cart_item(data["add_data"])
        url = BASE_URL + data["url"]
        user.request(method=data["method"], url=url, json={"id": cart_id})
        result = user.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
