import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


approve_datas = read_yaml("review_manage/review.yaml", "approve_review")


@allure.epic("民宿预订系统")
@allure.feature("评价管理")
class TestApproveReview:

    @allure.story("后台审核通过评价")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", approve_datas)
    def test_approve_review(self, admin, review_item, title, data):
        review_id = review_item(data)
        url = BASE_URL + data["url"].format(id=review_id)
        admin.request(method=data["method"], url=url)
        result = admin.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
