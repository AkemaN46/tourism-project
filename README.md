# 汐岸小筑 · 民宿预订与测试项目

民宿微信小程序、Web 管理后台及配套测试资料。项目包含房源浏览、房型与日期可订性、购物车、订单、收藏、评价审核等业务，以及接口自动化、JMeter 性能测试和民宿业务问答助手的批量评测。

## 项目结构

| 目录 | 内容 |
| --- | --- |
| `system_project/backend` | Java 17 / Spring Boot 2.7 后端，接口端口 8082 |
| `system_project/frontend/admin` | Vue 2 / Element UI 管理后台，开发端口 9532 |
| `system_project/frontend/miniprogram` | 微信原生小程序 |
| `system_project/sql` | MySQL 初始化与 V1.1 迁移脚本 |
| `api_auto` | Requests + Pytest + Allure 接口自动化 |
| `ai_test` | Dify Workflow 批量调用、关键词评测、LangChain LLM-as-Judge |
| `doc` | 需求、接口、迭代说明、测试用例、缺陷记录、测试报告及 RAG 知识库 |

## 本地运行

### 后端

准备 JDK 17 或兼容版本、Maven 和 MySQL。首次初始化前先检查 `system_project/sql/database.sql`：该脚本含建库、删表和示例数据语句，只应在准备好的开发数据库中执行。已有环境按需评估 V1.1 迁移脚本。

复制配置模板并填写自己的数据库及微信配置：

```powershell
Copy-Item system_project/backend/src/main/resources/application.example.yml system_project/backend/src/main/resources/application.yml
cd system_project/backend
mvn spring-boot:run
```

模板使用 `DB_USERNAME`、`DB_PASSWORD`、`WECHAT_APPID`、`WECHAT_SECRET`、`JWT_SECRET`、`ADMIN_INITIAL_PASSWORD` 环境变量。后端不会自动加载 Python 评测目录中的 `.env`。数据库中的示例账号与页面中的默认值仅用于本地演示。

运行时上传图片目录不入库；原有数据库如引用这些图片，需要自行恢复资源。

### 管理后台与小程序

```powershell
cd system_project/frontend/admin
npm ci
npm run dev
```

使用微信开发者工具导入 `system_project/frontend/miniprogram`，按自己的环境配置 AppID 和接口地址。`project.private.config.json` 是本机设置，不进入仓库。

### 接口自动化

```powershell
cd api_auto
python -m pip install -r requirements.txt
Copy-Item config.example.py config.py
# 配置 TEST_ADMIN_PASSWORD、WX_LOGIN_CODE 等环境变量后执行
python -m pytest
```

后端及测试数据需要提前准备；Allure HTML 报告生成还需要本机安装 Allure CLI。用例会创建、修改和清理业务数据，应使用测试环境。

### AI 问答批量评测

```powershell
cd ai_test
python -m pip install -r requirements.txt
Copy-Item .env.example .env
# 在本机 .env 中填写 Dify / Judge 密钥
python main.py
```

Dify 是被测应用；LangChain 用于测试侧语义评委。模型及 API 地址见 `ai_test/config.py`。默认不启用 LangSmith 追踪。执行会调用配置的外部模型服务，报告在本机 `ai_test/reports` 生成。

### 性能测试

JMeter 脚本位于 `doc/xn_test/Test.jmx`，参数数据位于 `doc/xn_data`。运行前替换房型、日期、测试账号及上传图片路径；需要 CSV 鉴权时，将 `auth.example.csv` 复制为本机 `auth.csv` 并填写测试凭据。历史 JTL 与测试文档保留用于复核，不代表新环境的测试结论。

## 文档入口

- [需求文档](doc/README/产品需求文档.md)
- [接口文档](doc/README/接口文档.md)
- [V1.1 迭代说明](doc/README/开发迭代说明-V1.1.md)
- [V1.2 迭代说明](doc/README/开发迭代说明-V1.2.md)
- [接口自动化说明](api_auto/README.md)
- [AI 评测框架说明](doc/README/AI应用批量评测框架说明.md)
- [测试用例](doc/testcase) / [缺陷记录](doc/bug) / [测试报告](doc/reports)

## 仓库收录范围

仅收录项目源码、必要资源、示例配置和项目文档。`.gitignore` 排除了 Codex 工作区与临时文件、编辑器状态、依赖、构建产物、运行日志、备份、上传图片、自动生成的 HTML / AI 报告，以及 `.env`、本机配置、Token 缓存和鉴权 CSV。依赖清单用于安装直接依赖，Python 依赖版本尚未锁定。
