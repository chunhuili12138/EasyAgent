## 功能概述

**Skill（技能）** 是 Agent 的可复用能力单元：把知识检索、数据库查询、外部 API、内置工具、大模型、数据转换或批量循环组织成有依赖关系的执行链，供智能会话和自动化工作流调用。

Skill 支持七类步骤。高风险 API 工具是否需要人工审批由工具的操作类型决定：`action` 类型在执行前进入 HITL，普通 Skill 步骤不是独立的审批步骤。

## 适用角色与前置条件

- **适用角色**：Agent 管理员（`rag:skill:list` 权限）。
- **前置条件**：按步骤类型准备数据源、Schema、API 工具或其他所需资源。

## 进入路径

主菜单：**Agent 管理 → Skill 管理**。

## 操作步骤

### 1. 新建 Skill

1. 点击页面右上角 **新建** 按钮。
2. 填写名称、租户内唯一编码、描述、触发关键词、命中最低分和启用状态。
3. 在步骤编排区域添加步骤，填写步骤 ID、类型、描述和配置。
4. 为需要顺序执行的步骤选择依赖关系；无依赖的步骤可以并行执行。
5. 点击 **试运行** 验证执行链，确认无误后点击 **保存**。

### 2. 配置步骤依赖

- 每个步骤使用 `depends_on` 引用其他步骤 ID；被依赖步骤完成后才会执行。
- 依赖关系不能重复、不能引用不存在的步骤，也不能形成循环。

### 3. 配置输出结构

- LLM、Transform 或其他需要结构化输出的步骤可配置 `output_schema` 对象。
- Transform 必须配置输入绑定和至少一个转换操作；保存前会校验 JSON 结构和操作类型。

### 4. 使用 Skill

- **智能会话**：系统根据 Skill 的描述、触发关键词和最低命中分选择 Skill。
- **自动化中心**：在工作流的 Skill 节点中绑定已保存的 Skill。

## 步骤类型总览

| 步骤类型 | 用途 | 关键配置 |
|---|---|---|
| `rag` | 在当前租户知识索引中检索 | `query`（可引用上游步骤） |
| `nl2sql` | 生成并执行只读 SQL | `datasource_code`、`query_hint` |
| `api` | 调用已配置的 HTTP 工具 | `tool_code`、`params` 或 `arguments` |
| `builtin` | 调用内置工具 | `tool_code`、`arguments` |
| `llm` | 独立大模型生成 | `prompt_template`、`temperature` |
| `transform` | 确定性数据转换 | `inputs`/`input`、`operations` |
| `foreach` | 对列表逐项执行 API 或内置工具 | `items`、`body`、`max_items` |

> **提示** RAG 检索使用当前租户索引和运行时 ACL，不需要在 Skill 中填写一个可独立创建的“知识库”资源。

## 配置项说明

### Skill 基础信息

| 配置项 | 必填 | 说明 |
|---|---|---|
| 名称 | 是 | 面向配置者和最终用户的 Skill 名称 |
| 编码 | 是 | 租户内稳定且唯一的英文编码，供执行链和审计引用 |
| 描述 | 是 | 说明适用场景、调用条件、返回内容和限制 |
| 触发关键词 | 否 | 帮助会话命中 Skill |
| 最低命中分 | 是 | 命中分低于此值时不会自动选择该 Skill |
| 状态 | 是 | 停用后不进入后续会话和执行链 |

### 通用步骤字段

每个步骤都应有符合格式的 `id`（字母开头，最多 64 个字符）、`type`、可选 `description` 和 `depends_on`。步骤 ID 只能使用字母、数字和下划线，并且在同一 Skill 内不能重复。

### 各步骤字段

- **RAG**：用 `query` 指定检索问题，可使用 `{{step_id}}` 引用上游输出；检索结果受当前用户 ACL 过滤。
- **NL2SQL**：`datasource_code` 必填；使用 `query_hint` 描述查询口径，也可以把说明写在步骤 `description` 中。
- **API**：`tool_code` 必填；用 `params` 或 `arguments` 将上游结果绑定到工具参数。工具是否触发 HITL 由工具的 `operationType`（`query`/`action`）决定。
- **Builtin**：`tool_code` 必须是 `current_datetime`、`date_calculate`、`calculator` 或 `unit_convert` 之一；参数放在 `arguments` 中。
- **LLM**：`prompt_template` 必填，可引用上游步骤；`temperature` 必须在允许范围内。
- **Transform**：`inputs`（或 `input`）定义绑定，`operations` 为不超过 20 个的转换操作，可选 `output_schema`。
- **Foreach**：`items` 必须引用一个列表，`body` 只能是 `api` 或 `builtin` 步骤，并配置 `body.config.tool_code`；可用 `max_items`、`max_attempts` 和 `continue_on_error` 控制批量边界。

## 配置示例

下面示例使用 Skill 页面“专家模式”支持的 YAML 字段；应用前请将资源编码和问题改成实际值：

```yaml
description: 根据当前时间生成回答
steps:
  - id: current_time
    type: builtin
    config:
      tool_code: current_datetime
      arguments:
        timezone: Asia/Shanghai
  - id: generate_answer
    type: llm
    depends_on:
      - current_time
    config:
      prompt_template: "使用 {{current_time}} 回答用户问题，内容清晰准确。"
      temperature: 0.3
```

NL2SQL 和 API 步骤的最小配置示例：

```yaml
- id: query_records
  type: nl2sql
  config:
    datasource_code: business_readonly
    query_hint: 查询最近 30 天已完成记录的 id 和 amount
- id: call_record_api
  type: api
  depends_on: [query_records]
  config:
    tool_code: update_record
    params:
      recordId:
        source: query_records
        path: "$[0].id"
        cardinality: one
        on_empty: fail
        on_multiple: fail
```

## 常见问题

**为什么 Skill 保存时报步骤配置错误？**
请检查步骤 ID、类型、依赖关系和对应的必填字段；NL2SQL、API、Builtin、LLM、Foreach 和 Transform 都有专用校验。

**试运行与真实调用有什么区别？**
试运行用于快速验证执行链；真实调用还会执行租户、ACL、限额和工具操作类型校验，并写入审计记录。

**为什么某些步骤没有被执行？**
步骤存在依赖关系、前序步骤失败，或前序失败策略导致后续步骤跳过时，会出现这种情况；请查看执行详情。

## 使用提示与边界

- API 工具的 `action` 操作会在执行前进入 HITL，不能通过 Skill 配置绕过。
- 外部 API 受 SSRF 主机白名单保护；NL2SQL 仅允许只读单条查询，并受 Schema、行数和超时限制。
- 删除 Skill 前请确认没有被自动化工作流引用，否则相关运行会失败。
