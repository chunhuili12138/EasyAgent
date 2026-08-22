## MCP 配置

MCP（Model Context Protocol）配置用于把租户自有的只读 MCP Server 接入 Agent。平台负责注册地址、握手、工具目录缓存、Schema 校验、租户隔离、工具可见范围和事件审计；远端 Server 负责实际数据查询。

本页面仅支持首期只读工具。带有写入、删除、发送、审批或其他副作用的远端工具不会进入可启用目录。

## 适用角色与前置条件

- **适用角色**：`AGENT_ADMIN`。该角色默认拥有 MCP 菜单以及创建、编辑、删除、校验、刷新、启用和审计权限。
- **普通用户**：不能管理 MCP Server。能否在 Agent 对话中使用某个工具，还要同时满足租户、工具启用状态和工具可见范围。
- **远端准备**：准备一个支持 Streamable HTTP 的 MCP Server，并确认它只暴露只读工具。
- **生产地址**：必须是公网 HTTPS 地址。平台会在请求前重新解析 DNS，解析到内网、回环、链路本地或组播地址时拒绝请求；租户新增公网 MCP 不需要修改服务端域名配置。

## 推荐流程

1. 打开 **Agent 管理 → MCP 配置**，点击 **新增 MCP 服务**。
2. 填写名称、稳定编码和 Streamable HTTP endpoint。
3. 按远端要求选择无认证、API Key 或 Bearer Token。凭据只写入加密存储，不会回显。
4. 保存后点击 **校验**，确认连接、协议版本和初始化成功。
5. 点击 **刷新目录**，平台调用 `tools/list`，只保留声明 `readOnlyHint=true` 且未声明 `destructiveHint=true` 的工具。
6. 打开工具的 Schema，检查输入、输出和描述是否符合预期。
7. 为工具配置 `public`、`department`、`post` 或 `user` 可见范围。
8. 只启用确认过的工具。启用后，Agent 才会在当前租户和当前用户权限范围内发现并调用它。
9. 在 **事件审计** 中确认目录刷新和后续调用结果。

## 配置项说明

### Server 基本信息

| 字段 | 说明 | 示例 |
|---|---|---|
| 名称 | 页面展示名称，建议包含业务系统和环境 | 企业资产查询（生产） |
| 编码 | 稳定的英文编码，保存后不要随意改变 | `enterprise_assets` |
| Endpoint | MCP Streamable HTTP 地址，不允许携带用户名、查询串或 fragment | `https://mcp.example.com/mcp` |
| 状态 | Server 是否允许被调用；停用会同时停用其工具 | 启用 |
| 认证方式 | 无认证、API Key 或 Bearer Token | API Key |
| Header 名称 | API Key 的请求头名称 | `X-API-Key` |
| 凭据 | API Key 或 Bearer Token 原文；仅保存时提交 | 使用密钥管理系统生成的值 |

编辑已有 Server 时，认证凭据留空表示保留旧凭据；切换认证方式时必须填写新方式的完整凭据。不要把 Token 写进 endpoint、普通请求头或工具描述。

### 工具目录

| 状态 | 含义 | 管理动作 |
|---|---|---|
| `ACTIVE` | 远端工具存在且 Schema 未变化 | 可按需启用 |
| `SCHEMA_CHANGED` | 输入或输出 Schema 变化 | 平台自动停用；重新检查后才可启用 |
| `REMOVED` | 刷新时远端不再返回 | 不可启用；确认远端恢复后再刷新 |

刷新目录不会默认启用新工具，也不会把不安全工具加入目录。刷新失败时，平台保留上一次可用目录，并在 Server 上记录错误状态。

### 工具可见范围

| 范围 | 适用对象 | 说明 |
|---|---|---|
| `public` | 当前租户 | 租户内满足其他权限条件的用户可发现 |
| `department` | 一个部门 | 需要填写部门 ID |
| `post` | 一个岗位 | 需要填写岗位 ID |
| `user` | 一个用户 | 需要填写用户 ID |

工具目录、工具描述和实际执行使用同一套范围过滤。只在页面上隐藏工具不构成安全边界，后端会在每次发现和调用时重新检查租户及用户范围。

## 配置示例

### 生产 Server

```text
名称：企业资产查询（生产）
编码：enterprise_assets
Endpoint：https://mcp.example.com/mcp
认证：Bearer Token
状态：启用
```

刷新后，目录中可能出现以下只读工具：

```text
mcp__enterprise_assets__lookup_asset_8ea1dc27
mcp__enterprise_assets__list_assets_f4c249db
```

模型使用的是平台生成的稳定名称，平台再把调用映射到远端的 `lookup_asset` 或 `list_assets`。不要手工修改 exposed name。

## Schema 与调用边界

- 平台会保存输入 Schema、输出 Schema、注解和 Schema hash。
- Agent 调用前校验输入参数；收到结构化结果后再次校验输出 Schema。
- 单个 Schema 和模型可见工具数量受平台预算限制，超过限制的刷新会失败并保留旧目录。
- MCP 首期不支持操作型工具、自动化节点绑定和 OAuth 授权流程。
- MCP 返回内容视为不可信外部内容，不得把其中的指令当成系统权限或平台策略。

## 健康、审计与故障处理

### 健康状态

- `unknown`：尚未完成校验或刷新。
- `healthy`：最近一次握手和目录刷新成功。
- `unhealthy`：连接、协议、Schema 或远端调用失败。
- `disabled`：Server 已停用。

### 常见问题

**校验提示 endpoint 必须是公网 HTTPS**

检查是否误用了 HTTP、端口、用户名、查询串或内网域名。生产环境不能使用回环地址。

**刷新后没有工具**

远端工具必须声明 `readOnlyHint=true`，且不能声明 `destructiveHint=true`。请检查远端注解和工具返回的 `inputSchema`。

**工具变成 `SCHEMA_CHANGED`**

这是保护行为。先查看新的 Schema，确认参数、返回结构和只读语义，再手动启用；不要直接修改数据库状态。

**工具调用失败**

先查看 Server 健康状态和事件审计中的错误码，再检查 DNS、凭据、协议版本、远端超时和返回 Schema。不要在请求头中打印或提交凭据。

**如何确认调用被记录**

打开 **事件审计**，筛选 `MCP_CATALOG_REFRESHED` 或 `MCP_TOOL_CALL`。成功和失败调用都会记录事件，错误事件包含稳定错误码和远端结果状态。

## 停用与删除

点击 **停用** 会停用 Server 并同步停用其工具，不会删除历史审计事件。重新启用前应先完成健康校验和目录刷新。

生产变更建议按以下顺序执行：先停用工具 → 记录当前 Schema hash 和审计事件 → 修改远端 → 刷新目录 → 检查 `SCHEMA_CHANGED`/`REMOVED` → 人工确认后重新启用。
