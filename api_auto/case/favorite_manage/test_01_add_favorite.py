import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


add_datas = read_yaml("favorite_manage/favorite.yaml", "add_favorite")


@allure.epic("民宿预订系统")
@allure.feature("收藏管理")
class TestAddFavorite:

    @allure.story("加入收藏")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", add_datas)
    def test_add_favorite(self, user, favorite_cleanup, title, data):
        url = BASE_URL + data["url"]
        user.request(method=data["method"], url=url, json=data["json_data"])
        result = user.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
        if result == 200:
            favorite_cleanup.append(data["json_data"]["roomId"])
