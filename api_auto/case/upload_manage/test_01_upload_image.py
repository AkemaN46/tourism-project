import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


upload_datas = read_yaml("upload_manage/upload.yaml", "upload_image")


@allure.epic("民宿预订系统")
@allure.feature("后台图片上传")
class TestUploadImage:

    @allure.story("上传图片")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", upload_datas)
    def test_upload_image(self, admin, title, data):
        files = {data["field_name"]: (data["file_name"], b"api automation image", data["content_type"])}
        url = BASE_URL + data["url"]
        admin.request(method=data["method"], url=url, files=files)
        result = admin.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
