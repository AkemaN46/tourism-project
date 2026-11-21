import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


create_datas = read_yaml("room_manage/room.yaml", "create_room")


@allure.epic("民宿预订系统")
@allure.feature("后台房型管理")
class TestCreateRoom:

    @allure.story("创建房型")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", create_datas)
    def test_create_room(self, admin, homestay_item, room_cleanup, title, data):
        homestay_id = homestay_item(data["homestay_data"])
        room_data = {**data["room_data"], "homestayId": homestay_id}
        url = BASE_URL + data["url"]
        admin.request(method=data["method"], url=url, json=room_data)
        result = admin.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
        if result == 200:
            room_cleanup.append(admin.response.json()["data"]["id"])
