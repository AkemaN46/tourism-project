import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


update_datas = read_yaml("review_manage/review.yaml", "reject_update_review")


@allure.epic("民宿预订系统")
@allure.feature("评价管理")
class TestUpdateRejectedReview:

    @allure.story("用户修改被驳回的评价")
    @allure.title("修改评价：{title}")
    @pytest.mark.parametrize("title,data", update_datas)
    def test_update_rejected_review(self, user, rejected_review, title, data):
        review_id = rejected_review(data)
        url = BASE_URL + data["update_url"].format(id=review_id)
        user.request(method=data["update_method"], url=url, json=data["update_data"])
        result = user.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
