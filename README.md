# EasyAgent 前端

本仓库是 EasyAgent 的管理端和智能问答前端，基于 Vue 3、TypeScript、Vite、Element Plus、Pinia 和 UnoCSS 开发。

## 功能范围

- 系统管理：用户、租户、部门、岗位、菜单、字典、日志和租户用量管理。
- 文档处理：文件管理、ACL、解析管理、数据处理、质量结果和知识库查询。
- Agent 工作台：智能会话、会话附件、知识检索、任务规划、工具执行和 HITL。
- Agent 管理：数据源、Schema、API 工具、Skill、经验池、BadCase 和审计。
- 动态权限：菜单和页面由后端权限生成；切换全局模式或租户时刷新菜单并关闭旧租户标签页。
- 国际化：中文与英文语言包。

## 环境要求

- Node.js 20.19+
- pnpm 8.7+
- 已启动的 EasyAgent 后端服务

## 安装与启动

在项目根目录执行：

```powershell
pnpm install
pnpm dev
```

默认开发地址：`http://localhost:9527`。

开发命令使用 Vite `test` Mode，接口地址来自 `.env.test`。生产构建使用 `.env.prod`。

## 环境变量

基础环境变量位于 `.env`，常用配置包括：

```dotenv
VITE_BASE_URL=/
VITE_APP_TITLE="EasyAgent"
VITE_AUTH_ROUTE_MODE=dynamic
VITE_ROUTE_HOME=home
VITE_HTTP_PROXY=Y
```

后端地址分别在以下文件配置：

- `.env.test`：开发和测试环境。
- `.env.prod`：生产环境。

环境文件可能包含本机地址，不应写入 API Key、密码或其他服务端凭据。

## 常用命令

```powershell
# 类型检查
pnpm typecheck

# 生产构建
pnpm build

# 测试环境构建
pnpm build:test

# 预览构建结果
pnpm preview
```

项目的 `lint` 命令包含 `--fix`，会直接修改文件；执行后需要检查差异。

## 目录结构

```text
src/
├── layouts/       主布局、顶部租户切换、菜单、标签页和页脚
├── locales/       中英文语言包
├── router/        动态路由及权限转换
├── service/       后端 API 客户端与请求封装
├── store/         Pinia 状态管理
├── typings/       API、路由和组件类型
└── views/         数据统计、系统管理、文档处理、Agent 工作台和 Agent 管理页面
```

## 开发约定

- 页面权限和按钮权限必须以后端返回的菜单及权限码为准。
- 租户 ID 不作为可信授权参数，权限边界由后端认证上下文决定。
- 切换租户后不得保留前一个租户的业务页面状态。
- API 返回的 Markdown 和富文本必须经过现有安全渲染链路。
- 用户可见文本需要同时补齐中文和英文语言包。
- 新页面应沿用现有 Element Plus 组件、表格、对话框和操作反馈模式。

## 许可证与来源

本管理端基于 [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin) 演进。原项目 MIT 许可证和版权声明保留在 [LICENSE](LICENSE)，使用和分发时应遵循该许可证。
