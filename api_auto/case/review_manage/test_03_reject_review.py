import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


reject_datas = read_yaml("review_manage/review.yaml", "reject_update_review")


@allure.epic("民宿预订系统")
@allure.feature("评价管理")
class TestRejectReview:

    @allure.story("后台驳回评价")
    @allure.title("驳回评价：{title}")
    @pytest.mark.parametrize("title,data", reject_datas)
    def test_reject_review(self, admin, review_item, title, data):
        review_id = review_item(data)
        url = BASE_URL + data["reject_url"].format(id=review_id)
        admin.request(method=data["reject_method"], url=url, json=data["reject_data"])
        result = admin.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
