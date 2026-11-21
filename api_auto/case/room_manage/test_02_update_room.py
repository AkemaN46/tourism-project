import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


update_datas = read_yaml("room_manage/room.yaml", "update_room")


@allure.epic("民宿预订系统")
@allure.feature("后台房型管理")
class TestUpdateRoom:

    @allure.story("修改房型")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", update_datas)
    def test_update_room(self, admin, room_item, title, data):
        context = room_item(data["create_data"])
        room_data = {**data["json_data"], "homestayId": context["homestay_id"]}
        url = BASE_URL + data["url"].format(id=context["room_id"])
        admin.request(method=data["method"], url=url, json=room_data)
        result = admin.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
