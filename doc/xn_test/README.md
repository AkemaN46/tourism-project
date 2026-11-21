性能测试数据说明

生成日期：2026-09-17
数据来源：本地 MySQL 数据库 xi_an_xiao_zhu。

JMeter 使用方式
1. 每个 HTTP 请求下添加“配置元件 > CSV Data Set Config”，文件编码选择 UTF-8。
2. 文件变量名由首行字段名自动定义，在请求中使用 ${roomId}、${checkInDate} 等。
3. 读接口可勾选“Recycle on EOF”；order_status_update.csv 必须取消勾选，避免同一订单重复更新。
4. 写接口运行结束后，请清理备注以 PERF_ORDER_ 开头的订单及性能测试专用用户的购物车记录。

文件对应关系
- auth.csv：订单和购物车接口的 token；本地后端按 token 格式解析性能测试专用用户 ID。
- room_list.csv：GET /room/list。
- room_detail.csv：GET /room/${roomId}。
- room_calendar.csv：GET /room/calendar。
- order_create.csv：POST /order/create。
- order_batch_create.csv：POST /order/batch-create，每行提供两笔订单字段。
- order_status_update.csv：PUT /order/${orderId}/status；当前订单归属用户 ID 9，必须使用该用户登录 token。
- cart_add.csv：POST /cart/add。
- cart_list_seed.csv：仅用于核对 GET /cart/list 的预置数据，不需要配置为 CSV 数据源。

上传接口需要独立准备有效的约 1 MB JPG/PNG 文件，不使用 CSV。
