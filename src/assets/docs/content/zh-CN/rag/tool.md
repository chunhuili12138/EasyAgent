## 功能概述

**工具管理** 用于把租户已有的 HTTP 接口声明为 Agent 可调用的能力：配置请求方式、认证、参数 Schema 与响应映射，并控制谁能调用、是否需要人工确认（HITL）。配置完成后，Skill 中的 `api` 步骤即可选择该工具执行。

## 适用角色与前置条件

- **适用角色**：Agent 管理员（`rag:tool:list` 权限）。
- **前置条件**：外部系统已提供可测试的接口文档；目标主机需在平台 **SSRF 白名单**内。

## 进入路径

主菜单：**Agent 管理 → 工具管理**。

## 操作步骤

### 1. 新建工具

1. 点击 **新建**，打开编辑对话框（三个页签）。
2. **基本信息**：填写名称、编码、描述、接口基础 URL、请求方法、操作类型、访问范围、超时与重试次数。仅路径参数需要在 URL 中保留 `{{参数}}` 占位符。
3. **认证配置**：选择认证方式并填写凭据（见下方配置项）。
4. **参数 Schema**：使用请求构建器逐项配置参数、请求头、请求体组装、成功响应规则与响应映射；普通配置无需手写 JSON，只有复杂嵌套结构或迁移已有配置时才使用对应区域的“高级 JSON”。
5. 点击 **保存**。回到工具列表后，在该工具操作列点击 **测试**，先执行 Dry-run，再根据接口风险决定是否执行真实请求。

推荐将同一业务的查询接口与写接口拆成两个工具，例如“查询订单”设为 `query`，“修改订单”设为 `action`。不要为了省略审批把写接口标成查询。

### 2. 测试工具

- **Dry-run（默认）**：只校验参数并渲染请求，不访问外部接口；
- **真实请求**：勾选"执行真实请求"后发送到外部系统；
- 测试输入会按参数 Schema 自动生成初始 JSON，可修改为实际边界值；
- 测试结果展示请求方法、地址、普通请求头、请求体、映射后响应或错误。认证头与用户身份头不会明文展示。

> **注意** 真实请求测试由 Agent 管理员直接发起，不经过聊天 HITL，也不按工具访问范围校验测试账号。操作类接口一旦开启真实请求会立即产生外部业务影响，请优先使用测试环境、幂等参数或可回滚数据。

### 3. 使用工具

- 在 Skill 的 `api` 步骤中选择该工具，配置参数映射；
- 在智能会话中执行 Skill 时，**操作类型为“操作（action）”** 的工具会在参数组装完成后强制进入 HITL，用户确认后才调用；
- 自动化工作流按已发布流程直接执行 API 节点，不弹出聊天 HITL。需要外部审批时，应在工作流中显式增加“等待事件/审批回调”节点。
- 运行时只向当前租户、已启用且当前执行用户符合访问范围的工具开放调用；工具管理页的管理员测试只校验租户归属，不模拟普通用户的访问范围。

## 配置项说明

### 基本信息

| 字段 | 必填 | 默认值 | 说明 |
|---|---|---|---|
| 名称 | 是 | - | 展示用名称 |
| 编码 | 是 | - | 保存后不可改，供 Skill/审计引用 |
| 描述 | 强烈建议 | - | 说明何时调用、需要什么、返回什么和不能做什么；留空虽可保存，但 Agent 难以稳定选择 |
| URL 模板 | 是 | - | 通常只填接口基础地址；`path` 参数需保留 `{{param}}` 占位符，旧 URL 参数模板仍兼容且不会重复追加 |
| 请求方法 | 是 | GET | GET / POST / PUT / DELETE |
| 操作类型 | 是 | 查询 | query 查询 / action 操作（**action 强制 HITL**） |
| 访问范围 | 是 | 公开 | public / department / post / user |
| 授权对象 | 按范围 | - | 部门/岗位/用户单选 |
| 超时 | 是 | 10 | 1–60 秒 |
| 重试次数 | 是 | 0 | 0–2；仅 GET、PUT、DELETE 等幂等方法在网络异常或 HTTP 5xx 时自动重试，POST 不自动重试 |

### 认证配置

| 认证方式 | 凭据字段 |
|---|---|
| 无认证 | - |
| Bearer | Token |
| Basic | 用户名、密码 |
| API 密钥 | 请求头名称（默认 X-API-Key）、密钥值 |
| AK/SK 签名 | AccessKey、SecretKey |

编辑时同类型凭据**全部留空 = 保留原密钥**；填写任一字段则需完整填写并整体替换。

认证的实际请求头如下：

| 方式 | 发送内容 |
|---|---|
| Bearer | `Authorization: Bearer <token>` |
| Basic | `Authorization: Basic <base64(username:password)>` |
| API 密钥 | 使用配置的请求头名称发送密钥值 |
| AK/SK | 自动发送 `X-Platform-Access-Key`、`X-Platform-Timestamp`、`X-Platform-Nonce`、`X-Platform-Signature` |

凭据保存时使用平台加密密钥加密，详情接口和编辑页都不会回显原文。切换认证方式时必须填写新方式所需的完整凭据。

| 字段 | 说明 |
|---|---|
| 传递用户身份 | 开启后携带当前用户上下文到外部系统 |
| 身份请求头 | 默认 `X-Platform-User-Context`；值为平台签名的短期用户上下文（有效期约 60 秒），外部系统必须验签后使用 |

### 参数 Schema

| 字段 | 说明 |
|---|---|
| 参数 Schema | 默认使用参数表格逐行维护逻辑参数名、说明、类型、HTTP 位置、外部名称和必填项；保存时自动序列化为执行器使用的 JSON Schema Draft 7。默认值、枚举和数值范围在行内高级属性中配置；仅嵌套对象、数组或迁移的复杂 Schema 使用“高级 JSON”。生成的 Schema 会使用 `x-in`/`in`、`x-http-name`/`httpName` 和 `default` 表示 HTTP 位置、外部名称和默认值 |
| 请求头 | 仍使用 JSON 键值编辑器，静态值或 `{{param}}` 占位符均可填写。选择预置模板会**覆盖**当前请求头内容，不会合并；动态请求头应在参数表格中把位置设为 Header；认证密钥不得写在这里 |
| 请求模板 | 默认选择“自动组装”，普通扁平请求体由参数 Schema 中的 body 参数生成，无需填写模板。需要固定字段或特殊组合时，在表格逐行选择“引用参数”或“固定值”；嵌套 JSON、数组和复杂 JSON 值使用“高级 JSON”。整个值只有一个 `{{param}}` 时保留原始类型，嵌入字符串时转成文本 |
| 成功响应规则 | 默认使用表单配置成功 HTTP 状态码、业务状态校验、状态路径、判断方式、期望值、消息路径和 `dataPath`。所有字段留空时 HTTP 2xx 即成功并保留完整响应；复杂规则可切换到“高级 JSON” |
| 响应映射 | 默认使用表格逐行填写“平台字段名”和“外部响应路径”，保存时自动生成映射 JSON。映射在成功规则提取后的数据上执行；设置 `dataPath` 后路径从提取节点开始填写。任一路径不存在则调用失败；复杂映射可使用“高级 JSON” |

### 表单配置方式

工具配置默认使用请求构建器，页面会在保存时自动生成与执行器兼容的 JSON 配置。需要维护已有复杂配置、嵌套对象或数组时，再切换到对应区域的“高级 JSON”。

1. **参数 Schema**：逐行新增参数，填写逻辑参数名、说明、类型、HTTP 位置、外部参数名和必填项。类型支持预置选择或直接输入；“自动”位置沿用 GET/DELETE 使用 query、POST/PUT 使用 body 的默认规则。`path` 参数必须在 URL 中保留同名占位符。默认值、枚举值和数值范围在每行的高级属性中配置。
2. **请求模板**：普通一级请求体选择“自动组装”，无需再写模板；仅在接口需要固定字段或特定组合时，使用表格选择“引用参数”或“固定值”。当前表单只维护一级字段，嵌套对象、数组和复杂 JSON 值请切换到高级 JSON；后端执行器支持这些结构。
3. **成功响应规则**：成功状态码可多选或直接输入；需要业务状态判断时，再填写状态路径、判断方式和期望值。数据提取路径和错误消息路径均为可选点号路径。所有字段留空时，继续使用默认 HTTP 2xx 成功规则。
4. **响应映射**：逐行填写平台输出字段名和响应路径。若成功规则设置了 `dataPath`，映射路径从该数据节点开始填写，例如 `dataPath` 为 `data` 时，订单 ID 映射应填写 `id`，而不是 `data.id`。

表单和高级 JSON 使用同一份保存数据。切换到高级 JSON 前应先完成当前表单编辑并保存，避免未保存的表单输入被覆盖。

## 配置示例

成功响应规则示例：

```json
{
  "httpSuccessStatuses": [200, 201],
  "successPath": "code",
  "successOperator": "in",
  "successValues": [0, "0", "SUCCESS"],
  "messagePath": "message",
  "dataPath": "data"
}
```

`successOperator` 支持 `equals`、`in`、`exists`、`not_empty`。设置 `dataPath` 后，响应映射路径从该节点开始，例如 `dataPath` 为 `data` 时，映射应写 `"recordId":"id"`，而不是 `"data.id"`。

参数 Schema 完整示例：

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["orderNo"],
  "properties": {
    "orderNo": {
      "type": "string",
      "description": "订单编号",
      "x-in": "path",
      "x-http-name": "orderNo"
    },
    "status": {
      "type": "string",
      "description": "订单状态",
      "enum": ["PAID", "SHIPPED", "COMPLETED"],
      "x-in": "query",
      "x-http-name": "order_status"
    },
    "page": {
      "type": "integer",
      "description": "页码，从 1 开始",
      "minimum": 1,
      "default": 1,
      "x-in": "query"
    },
    "reason": {
      "type": "string",
      "description": "操作原因",
      "minLength": 2,
      "maxLength": 200,
      "x-in": "body",
      "x-http-name": "operation_reason"
    },
    "requestId": {
      "type": "string",
      "description": "调用方请求编号",
      "x-in": "header",
      "x-http-name": "X-Request-Id"
    }
  }
}
```

- `properties` 的键是 Skill 与 Agent 使用的逻辑参数名。
- `x-in`（也兼容 `in`）可取 `query`、`path`、`body`、`header`。省略时，GET/DELETE 默认进入 query，POST/PUT 默认进入 body。
- `x-http-name`（也兼容 `httpName`）是外部接口实际接收的名称；省略时沿用逻辑参数名。
- `default` 只在参数未提供时补齐。值为 `null` 或空字符串的可选参数不会发送。
- `path` 参数必须在 URL 中保留同名占位符，例如 `https://api.example.com/orders/{{orderNo}}`。

若接口要求嵌套对象或固定字段，可额外填写请求模板：

```json
{
  "source": "easyagent",
  "operation_reason": "{{reason}}"
}
```

显式标记为 `body` 的参数会合并到对象模板，但不会覆盖模板内已有同名字段，因此上述 `operation_reason` 不会重复。若接口只需要扁平请求体，可不填请求模板，由 Schema 自动生成 `{"operation_reason":"..."}`。

响应映射示例：

```json
{
  "orderId": "order_no",
  "status": "status",
  "message": "message"
}
```

基础 URL 示例：

```text
https://api.example.com/orders/{{orderNo}}
```

执行时，`orderNo` 替换路径占位符，`status` 以 `order_status`、`page` 以 `page` 自动追加到 query，`requestId` 发送为 `X-Request-Id` 请求头。原有 `?orderNo={{orderNo}}` 形式仍兼容，已在 URL 中消费的参数不会再次追加。

AK/SK 使用平台固定 HMAC-SHA256 规则并自动生成 `X-Platform-Access-Key`、`X-Platform-Timestamp`、`X-Platform-Nonce`、`X-Platform-Signature`，页面不能自定义签名算法；外部系统需按 EasyAgent 的签名协议验签。

签名原文按以下顺序用换行符连接，空查询串也保留最后一行；`bodySha256` 与签名均为小写十六进制：

```text
accessKey
timestampSeconds
nonce
HTTP_METHOD
rawPath
rawQuery
bodySha256
```

`X-Platform-Signature = hex(HMAC-SHA256(secretKey, 签名原文))`。外部系统还应校验时间戳有效窗口与 nonce 防重放，SecretKey 不能通过接口或日志返回。

## 常见问题

**为什么测试结果提示"配置或入参校验失败"？**
请检查参数 Schema 是否为合法 JSON Schema、请求模板中的变量是否与 Schema 一致、凭据是否完整。

**调用外部接口失败有哪些常见原因？**
目标主机未加入全局白名单、域名解析到本机/内网、认证工具使用 HTTP、超时、请求或响应体过大、业务成功规则不匹配、响应映射路径不存在、认证凭据错误。

**为什么 Dry-run 通过，真实请求仍失败？**
Dry-run 只验证配置、参数、URL 和请求渲染，不会验证对方接口的认证、业务状态码与响应结构。开启真实请求后，再根据返回错误调整认证、成功规则和响应映射。

**为什么有些工具调用会弹出审批？**
智能会话中的操作型工具强制要求 HITL，属于安全控制，无法关闭。工具页真实请求测试会直接调用；自动化工作流也不会弹聊天确认，需要审批时必须在工作流中配置审批等待节点。

## 使用提示与边界

- 外部 API 调用受 **SSRF 主机白名单**与防重定向绕过保护，只允许访问白名单内的地址。
- 请求头字段禁止存储密钥，凭据应通过认证配置维护。
- 已启用 SSRF 防护时，带认证或用户身份的工具必须使用 HTTPS，解析到本机或内网地址的主机也会被拒绝。
- 单次请求体上限 512 KB，响应体上限 1 MB；超出后调用失败。
- 系统会阻止删除仍被**已启用 Skill**引用的工具。停用 Skill 后可以删除，但该 Skill 的定义仍保留旧编码，重新启用前必须重新绑定。
