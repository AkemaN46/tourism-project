import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


delete_datas = read_yaml("review_manage/review.yaml", "delete_review")


@allure.epic("民宿预订系统")
@allure.feature("评价管理")
class TestDeleteReview:

    @allure.story("删除评价")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", delete_datas)
    def test_delete_review(self, user, review_item, title, data):
        review_id = review_item(data)
        url = BASE_URL + data["url"].format(id=review_id)
        user.request(method=data["method"], url=url)
        result = user.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
