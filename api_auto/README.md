# 民宿系统接口自动化范围

> 依据 V1.1 接口文档整理。仅覆盖会创建、修改、删除或驱动业务状态流转的核心接口；房源列表、订单列表、详情等纯查询接口不单独纳入自动化范围。

## 1. 鉴权与 Token

| 接口 | 业务目的 | 覆盖状态 |
| --- | --- | --- |
| `POST /user/wxlogin` | 微信登录，获取用户 Token | 已实现 |
| `POST /api/admin/login` | 管理员登录，获取管理员 Token | 已实现 |

用户 Token 用于前台订单、购物车、收藏和评价接口；管理员 Token 用于后台订单、房源、用户和评价管理接口。

## 2. 订单管理

| 接口 | 业务目的 | 覆盖状态 |
| --- | --- | --- |
| `POST /order/create` | 创建单个订单 | 已实现 |
| `POST /order/batch-create` | 批量创建订单 | 已实现 |
| `PUT /order/{id}/status`，`status=1` | 用户将自己的待支付订单更新为已支付 | 已实现 |
| `PUT /order/{id}/cancel` | 用户取消待支付或已支付订单 | 已实现 |
| `PUT /order/{id}/status`，`status=2` | 管理员办理入住 | 已实现 |
| `PUT /order/{id}/status`，`status=3` | 管理员完成订单 | 已实现 |

订单状态主链路：`待支付(0) → 已支付(1) → 已入住(2) → 已完成(3)`；取消分支为 `0/1 → 已取消(4)`。

## 3. 购物车

| 接口 | 业务目的 | 覆盖状态 |
| --- | --- | --- |
| `POST /cart/add` | 加入购物车 | 已实现 |
| `PUT /cart/{id}` | 修改购物车项的入住、离店日期 | 待补充 |
| `POST /cart/remove` | 删除单个购物车项 | 待补充 |
| `POST /cart/clear` | 清空购物车 | 待补充 |

## 4. 收藏

| 接口 | 业务目的 | 覆盖状态 |
| --- | --- | --- |
| `POST /favorite/add` | 收藏房型 | 已实现 |
| `POST /favorite/remove` | 取消收藏 | 待补充 |

## 5. 评价与审核

| 接口 | 业务目的 | 覆盖状态 |
| --- | --- | --- |
| `POST /review/create` | 用户对已完成订单创建评价 | 已实现 |
| `POST /review/{id}/approve` | 管理员审核通过评价 | 已实现 |
| `POST /review/{id}/reject` | 管理员驳回评价 | 待补充 |
| `PUT /review/{id}/update` | 用户修改被驳回的评价，修改后重新待审核 | 待补充 |
| `DELETE /review/{id}/delete` | 用户删除自己的评价 | 待补充 |

## 6. 用户管理

| 接口 | 业务目的 | 覆盖状态 |
| --- | --- | --- |
| `POST /user/update` | 用户修改昵称、手机号、生日等资料 | 待补充 |
| `PUT /user/{userId}/status` | 管理员启用或禁用用户 | 待补充 |

## 7. 后台民宿与房型管理

### 民宿管理

| 接口 | 业务目的 | 覆盖状态 |
| --- | --- | --- |
| `POST /homestay/create` | 创建民宿 | 待补充 |
| `PUT /homestay/update/{id}` | 修改民宿信息 | 待补充 |
| `PUT /homestay/toggleStatus/{id}` | 上架或下架民宿 | 待补充 |
| `DELETE /homestay/delete/{id}` | 删除民宿 | 待补充 |

### 房型管理

| 接口 | 业务目的 | 覆盖状态 |
| --- | --- | --- |
| `POST /room/create` | 创建房型 | 待补充 |
| `PUT /room/update/{id}` | 修改房型信息、价格或库存 | 待补充 |
| `PUT /room/toggleStatus/{id}` | 上架或下架房型 | 待补充 |
| `DELETE /room/delete/{id}` | 删除房型 | 待补充 |

## 8. 图片上传

| 接口 | 业务目的 | 覆盖状态 |
| --- | --- | --- |
| `POST /upload/image` | 管理员上传 JPG/JPEG、PNG 或 WEBP 图片 | 待补充 |

需覆盖正常上传，以及不支持的格式、MIME 类型与扩展名不匹配、文件超过 5 MB 等校验场景。

## 9. 自动化执行原则

- 每个写操作同时校验 HTTP 状态码、响应 JSON 的 `code` 和关键业务字段。
- 涉及用户与管理员权限的接口，分别使用对应角色的 Token，并覆盖越权场景。
- 订单、评价、购物车等存在状态或前置条件的流程，按“创建数据 → 状态流转 → 清理数据”的顺序执行。
- 纯查询接口可作为前置数据获取或结果辅助校验，但不单独作为本自动化范围的核心用例。
