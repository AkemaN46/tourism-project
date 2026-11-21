import base64
import json
import pytest
from api.token_api import TokenAPI
from config import *


# 通用模块：从接口响应中提取业务状态码，供所有 fixture 的前置校验复用。
def _code(api):
    return api.response.json()["code"]


# 通用模块：只清理自动化创建的记录；已被用例删除时允许资源不存在。
def _remove_created(api, method, url, **kwargs):
    api.request(method=method, url=url, **kwargs)
    result = _code(api)
    assert result in (200, 404), f"测试数据清理失败：{url}，业务状态码：{result}"


@pytest.fixture(scope="session")
# 鉴权模块：获取（或复用缓存中的）用户 Token，作为所有前台接口的会话级前置条件。
def user():
    api = TokenAPI()
    api.wx_token(wx_login_url, wx_code)
    return api


@pytest.fixture(scope="session")
# 鉴权模块：获取管理员 Token，作为所有后台管理接口的会话级前置条件。
def admin():
    api = TokenAPI()
    api.admin_token(admin_login_url, admin_username, admin_password)
    return api


@pytest.fixture
# 订单模块：创建待支付订单，供支付、取消和越权状态流转用例作为前置数据；结束后自动取消。
def pending_order(user):
    order_ids = []

    # 订单模块：执行待支付订单的创建，并返回订单 ID 给测试用例使用。
    def create(order_data):
        user.request(method="post", url=BASE_URL + "/order/create", json=order_data)
        assert _code(user) == 200
        order_id = user.response.json()["data"]["id"]
        order_ids.append(order_id)
        return order_id

    yield create

    for order_id in order_ids:
        user.request(method="put", url=BASE_URL + f"/order/{order_id}/cancel", json={"reason": "自动化清理"})


@pytest.fixture
# 订单模块：登记测试中直接创建的订单，测试结束后统一取消，避免订单数据残留。
def order_cleanup(user):
    order_ids = []
    yield order_ids
    for order_id in order_ids:
        user.request(method="put", url=BASE_URL + f"/order/{order_id}/cancel", json={"reason": "自动化清理"})


@pytest.fixture
# 订单模块：基于待支付订单创建已支付订单，供管理员入住和完成订单用例使用。
def paid_order(user, pending_order):
    # 订单模块：创建订单后完成用户支付，返回已支付订单 ID。
    def create(order_data):
        order_id = pending_order(order_data)
        user.request(method="put", url=BASE_URL + f"/order/{order_id}/status", json={"status": 1})
        assert _code(user) == 200
        return order_id

    return create


@pytest.fixture
# 订单模块：创建已完成订单，供评价创建、审核和删除用例使用。
def completed_order(admin, paid_order):
    # 订单模块：将已支付订单依次更新为已入住、已完成，返回订单 ID。
    def create(order_data):
        order_id = paid_order(order_data)
        for status in (2, 3):
            admin.request(method="put", url=BASE_URL + f"/order/{order_id}/status", json={"status": status})
            assert _code(admin) == 200
        return order_id

    return create


@pytest.fixture
# 购物车模块：创建购物车项并登记到统一清理列表，供修改、删除和清空用例使用。
def cart_item(user, cart_cleanup):

    # 购物车模块：新增购物车项，并返回购物车项 ID。
    def create(cart_data):
        user.request(method="post", url=BASE_URL + "/cart/add", json=cart_data)
        assert _code(user) == 200
        cart_id = user.response.json()["data"]["id"]
        cart_cleanup.append(cart_id)
        return cart_id

    return create


@pytest.fixture
# 购物车模块：登记本用例新增的购物车项，测试结束后按 ID 移除。
def cart_cleanup(user):
    cart_ids = []
    yield cart_ids
    for cart_id in cart_ids:
        _remove_created(user, "post", BASE_URL + "/cart/remove", json={"id": cart_id})


@pytest.fixture
# 收藏模块：创建收藏关系并登记到统一清理列表，供取消收藏用例使用。
def favorite_item(user, favorite_cleanup):

    # 收藏模块：收藏指定房型，并返回房型 ID。
    def create(room_id):
        user.request(method="post", url=BASE_URL + "/favorite/add", json={"roomId": room_id})
        assert _code(user) == 200
        favorite_cleanup.append(room_id)
        return room_id

    return create


@pytest.fixture
# 收藏模块：登记本用例新增的收藏，测试结束后按房型 ID 取消。
def favorite_cleanup(user):
    room_ids = []
    yield room_ids
    for room_id in room_ids:
        _remove_created(user, "post", BASE_URL + "/favorite/remove", json={"roomId": room_id})


@pytest.fixture
# 评价模块：创建待审核评价并登记到统一清理列表，供审核和删除用例使用。
def review_item(user, completed_order, review_cleanup):

    # 评价模块：准备已完成订单并提交评价，返回评价 ID。
    def create(data):
        order_id = completed_order(data["order_data"])
        review_data = {**data["review_data"], "orderId": order_id}
        user.request(method="post", url=BASE_URL + "/review/create", json=review_data)
        assert _code(user) == 200
        review_id = user.response.json()["data"]["id"]
        review_cleanup.append(review_id)
        return review_id

    return create


@pytest.fixture
# 评价模块：创建并驳回评价，供“修改被驳回评价”用例使用；评价由 review_cleanup 清理。
def rejected_review(admin, review_item):
    # 评价模块：准备驳回状态并返回评价 ID。
    def create(data):
        review_id = review_item(data)
        url = BASE_URL + data["reject_url"].format(id=review_id)
        admin.request(method=data["reject_method"], url=url, json=data["reject_data"])
        assert _code(admin) == 200
        return review_id

    return create


@pytest.fixture
# 评价模块：登记本用例创建的评价，测试结束后按 ID 删除。
def review_cleanup(user):
    review_ids = []
    yield review_ids
    for review_id in review_ids:
        _remove_created(user, "delete", BASE_URL + f"/review/{review_id}/delete")


@pytest.fixture
# 民宿模块：创建民宿并登记到统一清理列表，供修改、上下架和删除用例使用。
def homestay_item(admin, homestay_cleanup):

    # 民宿模块：新增民宿并返回民宿 ID。
    def create(homestay_data):
        admin.request(method="post", url=BASE_URL + "/homestay/create", json=homestay_data)
        assert _code(admin) == 200
        homestay_id = admin.response.json()["data"]["id"]
        homestay_cleanup.append(homestay_id)
        return homestay_id

    return create


@pytest.fixture
# 民宿模块：登记本用例创建的民宿，测试结束后按 ID 删除。
def homestay_cleanup(admin):
    homestay_ids = []
    yield homestay_ids
    for homestay_id in homestay_ids:
        _remove_created(admin, "delete", BASE_URL + f"/homestay/delete/{homestay_id}")


@pytest.fixture
# 房型模块：创建“民宿 + 房型”前置数据，登记房型 ID 供统一清理。
def room_item(admin, homestay_item, room_cleanup):

    # 房型模块：先创建所属民宿，再创建房型，返回两个资源的 ID。
    def create(data):
        homestay_id = homestay_item(data["homestay_data"])
        room_data = {**data["room_data"], "homestayId": homestay_id}
        admin.request(method="post", url=BASE_URL + "/room/create", json=room_data)
        assert _code(admin) == 200
        context = {"homestay_id": homestay_id, "room_id": admin.response.json()["data"]["id"]}
        room_cleanup.append(context["room_id"])
        return context

    return create


@pytest.fixture
# 房型模块：登记本用例创建的房型，测试结束后按 ID 删除房型。
def room_cleanup(admin):
    room_ids = []
    yield room_ids
    for room_id in room_ids:
        _remove_created(admin, "delete", BASE_URL + f"/room/delete/{room_id}")


@pytest.fixture
# 用户模块：从当前用户 JWT 中解析用户 ID，供后台修改用户状态用例使用。
def user_id(user):
    payload = user.token.split(".")[1] + "=="
    return int(json.loads(base64.urlsafe_b64decode(payload))["sub"])


@pytest.fixture
# 用户模块：测试结束后恢复用户为启用状态，避免禁用操作影响后续执行。
def restore_user_status(admin, user_id):
    yield user_id
    admin.request(method="put", url=BASE_URL + f"/user/{user_id}/status", json={"status": 1})
