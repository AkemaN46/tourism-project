import allure
import pytest

from config import BASE_URL
from tools.get_log import log
from tools.read_yaml import read_yaml


create_datas = read_yaml("review_manage/review.yaml", "create_review")


@allure.epic("民宿预订系统")
@allure.feature("评价管理")
class TestCreateReview:

    @allure.story("提交评价")
    @allure.title("{title}")
    @pytest.mark.parametrize("title,data", create_datas)
    def test_create_review(self, user, completed_order, review_cleanup, title, data):
        order_id = completed_order(data["order_data"])
        review_data = {**data["review_data"], "orderId": order_id}
        url = BASE_URL + data["url"]
        user.request(method=data["method"], url=url, json=review_data)
        result = user.response.json()["code"]
        log.info(f"业务状态码：{result}")
        expect = data["expect"]["code"]
        assert expect == result
        if result == 200:
            review_cleanup.append(user.response.json()["data"]["id"])
