import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


remove_datas = read_yaml("favorite_manage/favorite.yaml", "remove_favorite")


@allure.epic("民宿预订系统")
@allure.feature("收藏管理")
class TestRemoveFavorite:

    @allure.story("取消收藏")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", remove_datas)
    def test_remove_favorite(self, user, favorite_item, title, data):
        favorite_item(data["room_id"])
        url = BASE_URL + data["url"]
        user.request(method=data["method"], url=url, json={"roomId": data["room_id"]})
        result = user.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
