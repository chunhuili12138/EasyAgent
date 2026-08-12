## 功能概述

**Skill（技能）** 是 Agent 可复用的受控执行链。它把知识检索、只读数据查询、外部 API、内置工具、LLM 生成、确定性数据转换和批量循环按依赖关系组成一个 DAG，供智能会话或自动化工作流调用。

Skill 支持三种意图类型和七类步骤。意图类型用于会话路由，步骤配置决定实际执行内容；两者应保持一致。

## 适用角色与前置条件

- **适用角色**：具有 `rag:skill:list` 权限的 Agent 配置人员。
- **前置条件**：先准备并测试 Skill 所需的数据源、Schema 和 API 工具；知识问答 Skill 还应确保相关文档已解析并完成索引。

## 进入路径

主菜单：**Agent 管理 → Skill 管理**。

## 推荐配置顺序

1. 点击页面右上角 **新建**，选择最接近业务目标的模板。
2. 填写名称、唯一编码和能力描述，再选择意图类型。
3. 配置触发词、正向示例、排除示例和规则匹配阈值。
4. 按产物拆分步骤，配置每一步的 ID、类型、说明、依赖和专用字段。API 步骤先选择工具，再从工具参数 Schema 选择请求参数；不要手工猜写参数名。
5. 点击 **试运行当前配置** 检查每一步输出。复杂配置可查看或编辑 YAML，但修改后必须先 **应用到表单**。
6. 保存并启用 Skill，再使用列表中的 **命中测试** 检查规则和语义命中；页面会显示命中来源。
7. 最后到智能会话中用自然、多轮的业务表达验证真实路由、权限、追问、HITL 和结果展示。

## 基础字段说明

| 配置项 | 必填 | 说明 |
|---|---|---|
| 名称 | 是 | 面向配置人员和最终用户的业务名称 |
| 编码 | 是 | 租户内唯一且稳定的英文编码，只使用字母、数字和下划线 |
| 描述 | 否，强烈建议 | 写清适用场景、所需输入、主要输出和能力边界；描述过空会降低 Agent 选择稳定性 |
| 意图类型 | 是 | `knowledge` 知识问答、`action` 数据查询或工具操作、`composite` 多步骤组合任务 |
| 触发词 | 否 | 逗号分隔的典型意图短语；用于规则强匹配、向量召回特征和 LLM 精排，未填写时仍可依靠名称、描述和正向示例参与语义召回 |
| 正向示例 | 否 | 每行一个应命中的完整表达；规则匹配时包含命中可将分数提升为 1.0 |
| 排除示例 | 否 | 每行一个不应执行本 Skill 的相似表达；包含命中时规则分数直接为 0 |
| 规则匹配阈值 | 是 | 页面范围为 0.50～1.00，步长 0.05；默认 0.65。语义精排另有知识型 0.85、操作/复合型 0.92 的系统安全阈值 |
| 状态 | 是 | 只有启用的 Skill 才会进入会话路由和可执行目录 |

### 意图类型怎么选

- **知识问答**：主要依据知识库内容生成回答，不改变外部业务状态。
- **数据查询或工具操作**：包含 NL2SQL、内置工具或 API 等执行任务。会话路由会将其视为操作型能力。
- **多步骤组合任务**：需要查询、转换、调用、汇总等多个阶段共同完成的任务。

意图类型不会自动生成或限制步骤。旧 Skill 未设置时，后端会按步骤类型推断；新配置应明确选择，避免路由优先级与实际能力不一致。

### 正向示例和排除示例

示例应使用真实用户会说的完整句子，而不是只写“查询”“处理”等词。正向示例覆盖明确应触发的表达；排除示例用于区分相似但不该执行的请求。排除示例优先于触发词和正向示例。

### 命中与语义召回

在 AUTO 智能会话和 **命中测试** 中，系统按以下顺序选择已启用 Skill：

1. 先检查排除示例；命中排除示例时直接排除该 Skill。
2. 对正向示例或全部触发词命中的请求使用规则强匹配。
3. 规则未命中时，在当前租户最多 100 个候选中，使用 Skill 名称、描述、触发词和正向示例生成向量，召回最相关的最多 5 个候选。
4. 由 LLM 只在这 5 个候选中进行语义精排，并校验 Skill 编码和置信度。知识型 Skill 至少 0.85，操作型和复合型 Skill 至少 0.92。

向量服务不可用时会降级为有限候选的 LLM 语义匹配，不会阻断聊天；命中测试会显示“LLM 语义匹配（向量服务降级）”。知识模式和通用模式不会因为语义召回而执行 Skill，只有 AUTO 模式参与 Skill 路由。

## 步骤类型与配置

| 类型 | 用途 | 关键配置 |
|---|---|---|
| `rag` | 检索当前租户知识索引 | `query`，留空时使用当前用户问题 |
| `nl2sql` | 生成并执行只读 SQL | `datasource_code`、`query_hint` |
| `api` | 调用已配置的 HTTP 工具 | `tool_code`、`params` 或 `arguments` |
| `builtin` | 日期、计算、换算或联网搜索 | `tool_code`、`arguments` |
| `llm` | 根据当前问题及上游结果生成内容 | `prompt_template`、`temperature` |
| `transform` | 确定性字段映射、过滤、聚合和组装 | `inputs`/`input`、`operations` |
| `foreach` | 对列表逐项执行 API 或内置工具 | `items`、`body`、`max_items` |

### 步骤摘要与状态

执行步骤页顶部会显示当前 DAG 的只读依赖链；存在分支时会分别列出每条从无依赖步骤到末端步骤的路径。每张步骤卡片还会显示类型、依赖数、参数数、循环/转换和输出合同摘要，并附带以下可扫描状态：

- **配置完整**：当前表单已通过前端基础校验；保存和运行时仍会执行后端、权限、Schema 与 HITL 校验。
- **需修正**：缺少数据源、工具、Prompt、输入、操作，或存在失效依赖、重复参数等，请按标签中的原因处理。
- **存在未知参数 / 缺少必填参数**：仅在已读取 API 工具参数 Schema 时显示；应选择有效参数或补齐必填项。
- **高级 JSON**：当前步骤或其输出合同包含表单不应覆盖的配置，继续编辑时保持高级 JSON。
- **操作风险 / HITL**：当前 API 或 foreach 循环体调用操作型工具；智能会话运行时仍需要人工确认，页面不能绕过该边界。

### 通用步骤字段

- `id`：字母开头，最多 64 个字符，只能包含字母、数字和下划线；同一 Skill 内唯一。
- `description`：说明本步骤产物和成功标准。NL2SQL 未填写 `query_hint` 时会使用该说明。
- `depends_on`：当前步骤必须等待的上游步骤 ID。依赖必须存在且不能形成循环；无依赖步骤可能并行执行。
- `output_schema`：可为 RAG、NL2SQL、API、内置工具或 LLM 声明 JSON Schema。校验失败会终止下游；LLM 配置后必须返回符合 Schema 的 JSON。

#### `output_schema` 配置方法

`output_schema` 使用 **JSON Schema Draft 7** 校验步骤的主输出本身，不会自动增加 `data`/`result` 包装层，也不会重命名字段。

普通场景建议使用步骤表单中的 **表单** 模式：先打开“启用输出 Schema 校验”，再选择根类型，填写标题和说明，在对象字段表格中新增字段，设置类型、描述和必填项，再按需打开字段的高级属性配置枚举、格式、正则、长度或数值范围。数组输出可直接选择元素类型；标量、空对象或数组同样可以保存为合同。页面保存时会自动生成 `output_schema` JSON，`$schema`、`type`、`properties` 和 `required` 不需要手工编写。

普通对象字段和数组元素可以在 **表单** 中继续展开，最多维护 5 层嵌套；每个对象层可维护子字段、必填项和是否允许未声明字段，数组元素也可以是对象或另一层数组。包含 `$ref`、`oneOf`、`anyOf`、`allOf`、条件规则或超过 5 层的结构时，切换到 **高级 JSON**。系统无法完整表达的历史 Schema 会保持高级模式，不会被表单转换或覆盖。foreach 的 `output_schema` 仍在自身高级 JSON 配置中维护。

| 字段 | 用途 |
|---|---|
| `$schema` | 可选，声明 Draft 7 版本，建议固定为 `http://json-schema.org/draft-07/schema#` |
| `title` / `description` | 给配置人员说明整体业务对象，不改变输出 |
| `type` | 根类型：`object`、`array`、`string`、`integer`、`number`、`boolean` 或 `null` |
| `properties` | `object` 的字段定义；每个字段至少写 `type` 和业务 `description` |
| `required` | 必须出现的字段名数组；其中每个名称也应在 `properties` 中定义 |
| `additionalProperties` | 设为 `false` 时拒绝未声明字段，适合稳定的下游 API 参数 |
| `enum` / `const` | 限制状态、类型等离散值或固定值 |
| `format` / `pattern` | 限制日期、时间、邮箱、URI 或自定义字符串格式 |
| `minLength` / `maxLength` | 限制字符串长度 |
| `minimum` / `maximum` / `multipleOf` | 限制数值范围和精度 |
| `items` / `minItems` / `maxItems` / `uniqueItems` | 定义数组元素及数量、去重约束 |

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "RefundDecision",
  "type": "object",
  "additionalProperties": false,
  "required": ["orderNo", "refundReason", "refundAmount", "priority"],
  "properties": {
    "orderNo": {
      "type": "string",
      "description": "业务订单号",
      "pattern": "^SO[0-9]{12}$"
    },
    "refundReason": {
      "type": "string",
      "description": "面向审批人员的退款原因",
      "minLength": 5,
      "maxLength": 200
    },
    "refundAmount": {
      "type": "number",
      "description": "退款金额，单位元",
      "minimum": 0.01,
      "maximum": 50000,
      "multipleOf": 0.01
    },
    "priority": {
      "type": "string",
      "description": "处理优先级",
      "enum": ["normal", "urgent"]
    },
    "evidence": {
      "type": "array",
      "description": "最多五条证据编号",
      "items": { "type": "string" },
      "maxItems": 5
    },
    "requestedAt": {
      "type": "string",
      "description": "申请时间，ISO 8601 格式",
      "format": "date-time"
    }
  }
}
```

注意：字段名区分大小写并会被下游直接引用；JSON 不能包含注释、单引号或尾随逗号。`required` 只控制字段是否存在，类型和范围仍需在 `properties` 中定义。输出 Schema 中的 `default` 只是注解，不会自动补值；需要补值时使用 Transform 的 `default` 操作或明确要求 LLM 生成。

### RAG

`query` 可留空以使用当前用户问题，也可填写固定问题或引用依赖步骤。检索始终按当前租户、当前用户 ACL 和可用索引执行；Skill 表单内不需要选择单独的“知识库”资源。

### NL2SQL

必须选择已启用的数据源。`query_hint` 应明确查询对象、条件、时间范围、统计口径和返回字段；执行器不会自动把当前用户问题拼接到该字段。需要使用上游条件时，可通过 `{{step_id}}` 或字段路径引用已声明依赖的步骤输出。实际查询仍受当前用户可见 Schema、只读 SQL、行数和超时限制。

### API

必须选择已启用且当前用户有权使用的工具。固定值可直接填写；上游绑定必须明确以下字段：

选择工具后，页面会读取工具参数 Schema 并显示参数总数、必填数、类型、说明和枚举。普通模式的参数名使用下拉选择，已配置参数会从候选中移除，未知参数、重复参数和缺少必填参数会在保存前提示。字符串、数字、整数、布尔值和枚举会使用对应输入控件；数组或对象等复杂值可进入高级 JSON。

上游绑定按来源、取值方式和空值处理分组展示。来源步骤必须加入依赖；路径可以使用受限 JSONPath。若工具没有可读取的参数 Schema，页面会保留自由参数模式，但需要根据工具页的参数配置和测试结果手动核对。

| 字段 | 用途与允许值 |
|---|---|
| 参数名 | 必须与 API 工具参数 Schema 的 `properties` 键完全一致，区分大小写 |
| `source` | 来源步骤 ID，且必须加入当前步骤的 `depends_on` |
| `path` | 受限 JSONPath，支持 `$`、点字段、数字下标、数组通配符 |
| `cardinality` | `one` 取单值；`many` 要求数组 |
| `on_empty` | `fail` 报错、`skip` 不发送参数、`default` 使用默认值 |
| `default` | `on_empty=default` 时使用，可为任意合法 JSON 值 |
| `on_multiple` | `one` 得到多值时 `fail` 或明确取 `first` |
| `max_items` | `many` 最多保留 1–200 项 |
| `overflow` | 超量时 `fail` 或 `truncate` |

```json
{
  "orderNo": {
    "source": "query_orders",
    "path": "$[0].orderNo",
    "cardinality": "one",
    "on_empty": "fail",
    "on_multiple": "fail"
  },
  "evidenceIds": {
    "source": "query_orders",
    "path": "$[*].evidenceId",
    "cardinality": "many",
    "on_empty": "default",
    "default": [],
    "max_items": 20,
    "overflow": "truncate"
  },
  "channel": "agent_chat"
}
```

Skill 只产生逻辑参数，不负责决定 HTTP 位置。API 工具执行器会按工具参数 Schema 中每个属性的 `x-in`/`in`（`query`、`path`、`body`、`header`）与 `x-http-name`/`httpName` 自动构造请求；未提供的参数可使用工具参数 Schema 的 `default`，值为 `null` 或空字符串的可选参数不会发送。原有 `{{param}}` URL 模板仍兼容，已经出现在 URL 中的参数不会重复追加。

系统不会猜测同名字段、静默取第一行或自动执行复杂转换；过滤、聚合、重命名应先使用 Transform。

智能会话调用 `action` 工具时会冻结参数并进入 HITL。独立 Skill 试运行不能完成聊天审批；自动化工作流的 Skill 节点当前禁止包含 API 步骤，工作流内的外部调用应使用 API 节点，并按需要显式增加等待事件或审批回调。

### Builtin

页面会按内置工具提供常用参数名和取值控件：时区、日期计算方式、日期、数量、单位、计算表达式和换算单位可直接选择或输入。仍可插入上游变量，例如 `{{current_time}}`；未在表单元数据中的高级参数可继续作为自由参数填写。`date_calculate` 的 `add` 使用 `base_date`、`amount`、`unit`，`difference` 使用 `start_date`、`end_date`、`unit`。

普通表单可选择：

- `current_datetime`：当前日期时间；
- `date_calculate`：日期计算；
- `calculator`：数学计算；
- `unit_convert`：单位换算。

专家 YAML 还支持 `web_search`，它依赖后端已配置 Tavily，参数包括 `query`、`topic`、`search_depth`、`max_results` 和 `time_range`。`web_search` 不能放在 `foreach` 中；建议在其后增加 LLM 步骤整理结果并保留来源链接。

### LLM

`prompt_template` 必填，引用的每个上游步骤都必须同时加入依赖。支持：

- `{{step_id}}`：引用完整输出；
- `{{step_id.path}}` 或 `{{step_id.$.path}}`：读取上游字段；
- `{{#each step_id}}...{{this.field}}...{{@index}}...{{/each}}`：只读遍历数组；不支持嵌套循环。

系统还会把当前用户问题追加到 LLM 上下文。字段映射、金额计算、过滤和聚合应交给 Transform，不应依赖 LLM 猜测。

### Transform

常用 Transform 可以使用 **表单** 模式：输入绑定按“本地名称、上游步骤、JSONPath、单值/多值”逐行维护；操作按顺序选择 `op` 和常用路径，其余操作字段保留在每行的 JSON 对象中。这样 `filter` 的 `operator`/`value`、`project`/`object` 的 `fields`、`slice` 的 `offset`/`limit` 等仍可完整表达。Transform 的 `output_schema` 也可在同一表单中配置，支持对象字段和数组元素递归展开至 5 层。复杂聚合、引用/组合/条件 Schema、超过层数的结构、历史配置或需要整体编辑时切换到 **高级 JSON**。两种模式都写入现有的 `inputs`、`operations` 和 `output_schema`，不会改变运行时契约。

使用 `input` 或 `inputs` 显式绑定上游结构化数据。`inputs` 是“输入名 → 绑定对象”，绑定字段与 API 参数绑定一致；每个 `source` 都必须加入 `depends_on`。`operations` 按数组顺序执行，最多 20 个操作，支持 `select`、`filter`、`project`、`rename`、`distinct`、`sort`、`slice`、`limit`、`aggregate`、`object`、`merge`、`default` 和 `cast`。

```json
{
  "inputs": {
    "orders": {
      "source": "query_orders",
      "path": "$",
      "cardinality": "many",
      "on_empty": "fail",
      "max_items": 200,
      "overflow": "fail"
    }
  },
  "operations": [
    { "op": "select", "path": "$.orders" },
    { "op": "filter", "path": "$.status", "operator": "equals", "value": "paid" },
    {
      "op": "project",
      "fields": {
        "orderNo": "$.orderNo",
        "refundAmount": "$.paidAmount",
        "reason": "客户申请退款"
      }
    },
    { "op": "slice", "offset": 0, "limit": 20 }
  ],
  "output_schema": {
    "type": "array",
    "maxItems": 20,
    "items": {
      "type": "object",
      "additionalProperties": false,
      "required": ["orderNo", "refundAmount", "reason"],
      "properties": {
        "orderNo": { "type": "string" },
        "refundAmount": { "type": "number", "minimum": 0.01 },
        "reason": { "type": "string", "minLength": 2, "maxLength": 200 }
      }
    }
  }
}
```

`filter.operator` 仅支持 `equals`、`not_equals`、`in`、`contains`、`exists`、`gt`、`gte`、`lt`、`lte`；`aggregate` 支持 `count`、`sum`、`avg`、`min`、`max`；`sort.direction` 仅支持 `asc`/`desc`。`limit` 是有界列表截取的别名，使用 `limit` 或 `count` 指定数量。

路径只允许 `$`、点字段、数字下标和数组通配符。运行时限制为最多 200 项、1 MB JSON 和 32 层嵌套，不支持脚本、网络或文件访问。

### Foreach

普通批量处理可使用 **表单** 模式：选择一个上游列表引用，必要时填写数组容器路径，设置最大项数、单项重试和失败后是否继续，再选择 API 或内置工具并维护循环体参数。循环体参数支持 `{{item}}`、`{{item.field}}` 和 `{{index}}`。`item_path` 只能选择 `records`、`data.records`、`items`、`rows` 等数组容器，不能用来投影每一项的字段。包含额外循环体配置、复杂绑定或历史 JSON 时请使用 **高级 JSON**；两种模式都写入同一个 `config` 契约。

`items` 引用上游数组，可选 `item_path`；`body` 只允许 `api` 或普通 `builtin`。完整示例：

```json
{
  "items": "{{query_orders}}",
  "item_path": "records",
  "max_items": 50,
  "max_attempts": 1,
  "continue_on_error": true,
  "body": {
    "type": "api",
    "config": {
      "tool_code": "create_follow_up_task",
      "params": {
        "orderNo": "{{item.orderNo}}",
        "reason": "{{item.reason}}",
        "sequence": "{{index}}"
      }
    }
  }
}
```

| 字段 | 用途 |
|---|---|
| `items` | 必填，引用已加入依赖的上游步骤 |
| `item_path` | 上游为对象时指向其中数组，例如 `records` 或 `data.records`；直接数组可省略 |
| `max_items` | 1–200，输入超过上限会失败 |
| `max_attempts` | 1–3；非幂等操作 API 不会自动重试 |
| `continue_on_error` | `true` 记录单项失败并继续；`false` 首次失败即停止 |
| `body.type` | 仅 `api` 或 `builtin` |
| `body.config` | API 使用 `params`，内置工具使用 `arguments`；支持 `{{item}}`、`{{item.field}}`、`{{index}}` |
| `output_schema` | 可选，校验整个批量结果对象，而不是单项工具结果 |

联网搜索和嵌套循环不能放入循环体。操作 API 整个批次只进行一次 HITL。

## 测试功能的真实含义

### 命中测试

命中测试只检查**已保存、已启用** Skill，不包含编辑弹窗中的未保存内容。系统先执行规则强匹配，再执行名称、描述、触发词和正向示例的向量召回与租户内 LLM 精排，并在结果中显示“规则匹配”或“向量召回 + LLM 语义精排”。向量服务异常时显示降级来源。它只验证 Skill 选择，不执行完整步骤；“命中”不等于 API、数据库、HITL 或后续 LLM 执行链一定成功。

### 试运行当前配置

试运行可执行弹窗内尚未保存的当前定义，用于检查依赖关系和每步输出：

- 关闭操作检查时，`action` API 步骤以 dry-run 结果跳过，不会调用外部接口；
- 开启操作检查时，由于独立试运行没有聊天会话，`action` 步骤应被 HITL 门槛取消，仍不会调用外部接口；
- 查询型 API、RAG、NL2SQL、内置工具和 LLM 仍可能真实访问外部服务、数据库、模型或索引。

需要验证操作工具真实执行时，应保存 Skill 后到智能会话中完成 HITL；工具自身的真实请求测试则会绕过聊天 HITL，必须只对测试环境或可回滚数据使用。

## YAML 示例

```yaml
description: 查询售后记录并生成用户可读结论
intent_type: composite
positive_examples:
  - 帮我核对这笔售后申请是否符合规则
negative_examples:
  - 只解释一下售后规则，不要查询我的记录
steps:
  - id: query_records
    type: nl2sql
    description: 查询当前用户可见的售后记录
    config:
      datasource_code: business_readonly
      query_hint: 查询用户问题对应的售后记录，返回 id、status、amount 和 created_at
  - id: generate_answer
    type: llm
    depends_on: [query_records]
    config:
      prompt_template: |
        根据查询结果回答用户，字段缺失时明确说明，不要猜测。
        {{#each query_records}}
        - 编号：{{this.id}}，状态：{{this.status}}，金额：{{this.amount}}
        {{/each}}
      temperature: 0.2
```

## 保存、停用、删除与自动化引用

- 保存时会校验步骤 ID、依赖、专用必填字段、JSON/YAML 和执行边界，但保存成功不代表业务结果正确。
- 停用只让 Skill 退出路由并保留配置，可随时重新启用；删除会永久移除 Skill 配置且无法恢复，但不会删除历史运行记录。
- 删除前需人工确认没有工作流引用。当前删除操作不会主动拦截已有自动化引用，引用失效后相关工作流运行会失败。
- 工作流发布会冻结 Skill 的版本和 YAML；自动化 Skill 节点仅适合不含 API 调用的能力。外部调用请在线性工作流中使用 API 节点配置。

## 安全边界

- 数据源、Schema、工具和知识检索始终受租户与当前执行身份 ACL 约束。
- NL2SQL 仅允许受控的只读单语句查询。
- 外部 API 受认证、参数 Schema、SSRF 出站策略、超时和审计约束。
- Skill 配置不能绕过聊天 HITL，也不能把高风险操作伪装为查询。
