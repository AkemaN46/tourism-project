# 旅游项目小程序 + 后台

## 1. 项目简介

本项目是一个“旅游民宿预订”系统，包含：

- 微信小程序客户端：浏览民宿、查看房间、收藏、购物车、下单、订单管理、评价、资讯和个人中心。
- Web 管理后台：民宿、房间、订单、用户、评价、新闻和数据看板管理。
- Java 后端服务：提供小程序和管理后台使用的 REST API，并连接 MySQL 数据库。

当前项目部署目录：

```text
D:\Projects\tourism-project\system_project
```

## 2. 技术框架

### 2.1 后端

- Java，项目编译目标为 Java 17；本机可使用 JDK 21 运行。
- Spring Boot 2.7.18
- Spring MVC：提供 REST 接口。
- Spring Security：接口安全和请求拦截。
- Spring Data JPA + Hibernate：数据库访问和 ORM 映射。
- MySQL：业务数据存储。
- JWT：生成用户登录 Token。
- Lombok、FastJSON、MySQL Connector/J 等辅助组件。

后端采用较典型的 Controller → Service → Repository → Entity 分层结构。

### 2.2 管理后台

- Vue 2.6
- Vue Router 3
- Element UI
- Axios
- ECharts
- Vue CLI 4

开发服务器端口为 `9532`。前端请求统一使用 `/api`，开发服务器会将请求代理到后端 `http://localhost:8082`，并去掉 `/api` 前缀。

### 2.3 微信小程序

小程序使用微信原生开发模式：

- JavaScript
- WXML
- WXSS
- JSON 页面配置

小程序不使用 Vue 或 React，也不需要通过 npm 构建。使用微信开发者工具直接打开 `frontend/miniprogram` 即可。

## 3. 目录结构

```text
system_project/
├─ backend/                                  # Spring Boot 后端
│  ├─ pom.xml                                # Maven 配置和依赖
│  ├─ src/main/java/com/homestay/xiaozhu/
│  │  ├─ XiAnXiaoZhuApplication.java         # Spring Boot 启动类
│  │  ├─ config/                             # 全局异常、安全、MVC 配置
│  │  │  ├─ GlobalExceptionHandler.java
│  │  │  ├─ SecurityConfig.java
│  │  │  └─ WebMvcConfig.java
│  │  ├─ controller/                         # REST 接口层
│  │  │  ├─ AdminController.java
│  │  │  ├─ DashboardController.java
│  │  │  ├─ FavoriteController.java
│  │  │  ├─ HomestayController.java
│  │  │  ├─ NewsController.java
│  │  │  ├─ OrderController.java
│  │  │  ├─ RecommendationController.java
│  │  │  ├─ ReviewController.java
│  │  │  ├─ RoomController.java
│  │  │  ├─ ShoppingCartController.java
│  │  │  ├─ UploadController.java
│  │  │  └─ UserController.java
│  │  ├─ entity/                             # JPA 实体和 Token 工具
│  │  ├─ repository/                         # Spring Data JPA Repository
│  │  ├─ service/                            # 业务接口和实现
│  │  ├─ util/                               # Token、参数校验等工具
│  │  └─ dto/                                # 数据传输对象
│  ├─ src/main/resources/
│  │  └─ application.yml                     # 端口、数据库、微信配置
│  ├─ uploads/images/                        # 后端上传的图片资源
│  └─ target/                                # Maven 构建产物
├─ frontend/
│  ├─ admin/                                 # Vue 管理后台
│  │  ├─ src/
│  │  │  ├─ views/                           # 登录、看板、民宿、房间、订单等页面
│  │  │  ├─ router/                          # Vue Router 路由
│  │  │  ├─ utils/                           # Axios 请求封装
│  │  │  ├─ App.vue
│  │  │  └─ main.js
│  │  ├─ package.json                         # npm 依赖和启动脚本
│  │  └─ vue.config.js                       # 端口和后端代理配置
│  ├─ miniprogram/                           # 微信小程序源码
│  │  ├─ app.js                              # 小程序入口逻辑
│  │  ├─ app.json                            # 页面、TabBar 等全局配置
│  │  ├─ app.wxss                            # 全局样式
│  │  ├─ pages/                              # 首页、房间、订单、个人中心等页面
│  │  ├─ components/                         # 公共组件
│  │  ├─ assets/                             # 图标和图片
│  │  ├─ styles/                             # 公共 WXSS 样式
│  │  ├─ utils/                              # 请求、日期、订单、校验工具
│  │  └─ project.config.json                 # 微信开发者工具配置
│  └─ project.config.json                    # 外层工程配置，不作为小程序导入目录
└─ sql/
   └─ database.sql                           # 建库、建表和演示数据脚本
```

## 4. 数据库

数据库脚本位于：

```text
D:\Projects\tourism-project\system_project\sql\database.sql
```

脚本会创建数据库 `xi_an_xiao_zhu`，并初始化民宿、房型、房间、用户、管理员、订单、评价、收藏、购物车和新闻等表及演示数据。

后端默认数据库配置位于：

```text
D:\Projects\tourism-project\system_project\backend\src\main\resources\application.yml
```

默认连接信息为：

```yaml
url: jdbc:mysql://localhost:3306/xi_an_xiao_zhu
username: root
password: 123456
```

正式环境请修改为独立数据库账号，不要直接使用 root 账号。

## 5. 本地启动

### 5.1 启动后端

确保 MySQL 服务已启动，并确认 `application.yml` 中的数据库配置正确。

```powershell
cd D:\Projects\tourism-project\system_project\backend
& 'D:\Java\jdk21\bin\java.exe' -jar '.\target\xi-an-xiao-zhu-0.0.1-SNAPSHOT.jar'
```

后端默认地址：

```text
http://localhost:8082
```

### 5.2 启动管理后台

```powershell
cd D:\Projects\tourism-project\system_project\frontend\admin
npm install
npm run dev
```

管理后台地址：

```text
http://localhost:9532
```

默认管理后台登录账号：

```text
用户名：admin
密码：admin123
```

### 5.3 打开微信小程序

在微信开发者工具中选择「导入项目」，目录选择：

```text
D:\Projects\tourism-project\system_project\frontend\miniprogram
```

不要选择 `frontend` 或 `system_project`，否则可能无法正确识别小程序页面配置。

小程序接口地址配置位于：

```text
D:\Projects\tourism-project\system_project\frontend\miniprogram\utils\config.js
```

本机开发时默认使用：

```javascript
API_BASE_URL: 'http://localhost:8082'
```

微信开发者工具中可以在「详情 → 本地设置」勾选“不校验合法域名、web-view 业务域名、TLS 版本以及 HTTPS 证书”。

真机调试时，不能使用 `localhost`，需要改成电脑局域网 IP，并确保手机和电脑在同一个局域网内。

## 6. 微信登录配置

小程序的 AppID 位于：

```text
D:\Projects\tourism-project\system_project\frontend\miniprogram\project.config.json
```

当前小程序 AppID 为：

```text
wx2fe5da12660de999
```

后端 `application.yml` 中的 `wechat.miniprogram.appid` 必须与小程序 AppID 完全一致，`secret` 必须填写该 AppID 对应的 AppSecret。

如果出现以下错误：

```text
errcode: 40029
invalid code
微信授权失败，请重试
```

优先检查：

1. 前后端 AppID 是否一致。
2. 后端 AppSecret 是否属于同一个 AppID。
3. 微信 `code` 是否已经被使用；每次调用 `wx.login()` 获取的 code 只能换取一次会话。
4. 修改配置后是否重新构建并重启后端。

不要把真实 AppSecret 提交到 Git 或公开仓库。

## 7. 主要业务模块

- 民宿：民宿列表、详情、上下架、图片和基础信息。
- 房间：房型、价格、库存、房态和设施信息。
- 用户：微信登录、用户资料和账号信息。
- 订单：下单、批量下单、订单详情、取消和评价。
- 评价：用户评价、后台审核和回复。
- 收藏与购物车：收藏民宿/房间，管理待预订房间。
- 新闻资讯：资讯分类、列表和详情。
- 数据看板：收入、订单、用户、入住率和房型分布统计。
- 文件上传：上传民宿、房间和用户相关图片。

## 8. 常见问题

### 管理后台能打开，但接口报错

确认后端已启动并监听 `8082`，再检查 `frontend/admin/vue.config.js` 中的代理目标是否仍为：

```text
http://localhost:8082
```

### 小程序页面能打开，但微信登录失败

检查第 6 节中的 AppID、AppSecret 和微信 code 配置。仅勾选“不校验合法域名”不能解决 AppID 或 AppSecret 不匹配问题。

### 真机访问不到后端

将小程序接口地址从 `localhost` 改为电脑局域网 IP，例如：

```javascript
API_BASE_URL: 'http://192.168.1.100:8082'
```

同时检查 Windows 防火墙、端口开放情况和手机网络环境。
