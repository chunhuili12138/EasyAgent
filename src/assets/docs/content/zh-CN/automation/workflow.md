## 功能概述

**自动化中心**提供可视化工作流设计器：通过节点、连线和资源绑定，把 AI 能力、业务接口与人工审批编排为可持久执行的流程。工作流可以由 Cron、Webhook、内部事件或审批回调触发。

工作流按**草稿 → 校验 → 发布**管理。发布版本被冻结，运行实例始终使用已发布版本；修改画布不会改变已经发布或正在运行的版本。

## 适用角色与前置条件

- **适用角色**：拥有自动化工作流查看/管理权限的 Agent 管理员。
- **前置条件**：平台管理员已启用自动化引擎。调用 Skill、数据源、Schema、API 或子流程前，应先创建对应资源。

## 进入路径

主菜单：**自动化中心 → 工作流设计**。

## 操作步骤

### 1. 创建与设计

1. 点击**新建**，填写名称、编码和描述，并选择空白或模板流程。
2. 在设计器中从节点面板拖入节点，连接开始节点、业务节点和结束节点。
3. 为需要外部资源的节点选择 `resourceAlias`，并在工作流级别配置对应的资源绑定。
4. 使用高级 JSON 编辑器补充输入、输出、变量 Schema 和字段映射；字段路径使用设计器提供的变量树。

### 2. 校验与发布

1. 点击**校验**，检查节点类型、Schema、资源绑定、连线、无环图和数据契约。
2. 修复校验错误后点击**发布**。发布会生成冻结的运行版本。
3. 前往**触发器管理**，为已发布工作流配置 Cron、Webhook、内部事件或审批回调。

### 3. 运行与监控

1. 在工作流详情中点击**运行**，填写工作流输入和运行变量；手动运行会真实调用节点。
2. 在**运行实例**查看流程状态和最终输出，在**执行日志**查看每次节点尝试。
3. 节点失败且达到重试条件后会创建**失败任务**；打开的死信任务可重试或放弃。

## 节点类型

| 类型 | 作用 |
|---|---|
| 开始 / 结束 | 定义流程入口和出口 |
| 条件 / 并行 | 分支判断或并行执行 |
| 延时 / 等待事件 | 等待时间、内部事件、Webhook 或审批结果 |
| 批量循环 | 读取数组并按批次执行一个子节点 |
| 聚合 / 转换 | 合并分支、筛选、重命名、转换和模板化数据 |
| 内置工具 | 调用 `current_datetime`、`date_calculate`、`calculator`、`unit_convert` |
| 数据源 / RAG / LLM / NL2SQL | 使用已绑定的数据源、知识检索或模型能力 |
| Skill / Agent | 调用已配置的 Skill 或 Agent 任务 |
| API | 调用已绑定的 API 工具 |
| 子流程 | 调用已绑定的工作流 |

## 定义结构（schemaVersion 2）

设计器保存的是 JSON 定义，不是旧版的 `name/trigger/config` YAML。主要字段如下：

| 字段 | 说明 |
|---|---|
| `schemaVersion` | 当前应为 `2` |
| `nodes` | 节点数组。每项包含 `id`、`type`、`name`、`config`、输入/输出 Schema、字段映射和 `executionPolicy` |
| `edges` | 连线数组。每项包含 `id`、`source`、`target`、可选 `condition` 和 `defaultBranch` |
| `inputSchema` | 工作流输入 JSON Schema；触发器输入和手动运行输入按此校验 |
| `variablesSchema` | 运行变量 JSON Schema |
| `outputSchema` | 工作流最终输出 JSON Schema |
| `finalOutput` | 从 `workflow.input`、`workflow.variables` 或 `nodes.<id>.output` 映射最终输出 |
| `resourceBindings` | 冻结资源清单。每项至少包含合法 `alias`、`resourceType` 和正数 `resourceId`，可带 `resourceCode`、`resourceVersion`、`constraints` |
| `policies` | 设计器或流程级策略元数据；节点重试和失败行为配置在节点的 `executionPolicy` |

### 资源别名

`resourceAlias` 写在节点 `config` 中，并且必须与 `resourceBindings[].alias` 完全对应。资源类型必须匹配节点：API→`api`、Skill→`skill`、数据源→`datasource`、NL2SQL→`schema`、子流程→`workflow`。发布时会冻结资源 ID/版本，运行时不会按客户端输入重新选择资源。

### 节点执行策略

```json
{
  "maxRetries": 2,
  "retryDelay": "PT10S",
  "timeoutMs": 60000,
  "failurePolicy": "FAIL_WORKFLOW"
}
```

`maxRetries` 范围为 0–10，`retryDelay` 使用正的 ISO-8601 时长，`timeoutMs` 范围为 100–3600000。`failurePolicy` 为 `FAIL_WORKFLOW` 或 `ERROR_BRANCH`；使用 `ERROR_BRANCH` 时必须填写指向其他节点的 `failureTarget`。

### 常用节点配置

- **延时**：`config.duration`，例如 `PT5M`。
- **等待事件**：可配置 `eventSchema`；外部审批还需 `approvalProviderId`、`correlationKeyPath` 和 `approvalTimeout`。
- **批量循环**：`itemsPath`、`batchSize`（1–500）、`maxConcurrency`（1–32）、`rateLimitPerSecond`、`maxAttempts`、`failureThreshold` 和 `body`。
- **LLM**：必须提供节点 `outputSchema`；可配置 `maxCompletionTokens`、`minConfidence` 和 `confidenceField`。
- **转换**：`operations` 为数组，支持 select、remove、rename、default、coerce、filter、map、flatten、distinct、sort、limit、compute、template。

## 最小定义示例

以下示例展示真实字段结构；实际流程请使用设计器生成，并通过校验后再发布：

```json
{
  "schemaVersion": 2,
  "nodes": [
    {"id": "start", "type": "start", "name": "开始", "config": {}},
    {"id": "now", "type": "builtin", "name": "获取时间", "config": {"toolCode": "current_datetime", "resourceAlias": null}},
    {"id": "end", "type": "end", "name": "结束", "config": {}}
  ],
  "edges": [
    {"id": "edge_start_now", "source": "start", "target": "now", "defaultBranch": false},
    {"id": "edge_now_end", "source": "now", "target": "end", "defaultBranch": false}
  ],
  "inputSchema": {"type": "object", "properties": {}},
  "variablesSchema": {"type": "object", "properties": {}},
  "outputSchema": {"type": "object", "properties": {}},
  "finalOutput": [],
  "policies": {},
  "resourceBindings": []
}
```

## 常见问题

**为什么不能发布？**
先执行校验，重点检查是否只有一个开始节点、至少一个结束节点、节点和连线 ID 唯一、所有节点可达且无环，并确认资源别名和 Schema 合法。

**修改草稿后为什么运行结果没变化？**
运行使用已发布版本。修改后必须重新校验并发布，触发器下一次运行才会使用新版本。

**失败任务如何处理？**
在失败任务中查看 `reasonCode` 和状态。状态为“待处理”的死信任务可重试生成新的运行，或放弃该任务；重试前应确认外部操作是否幂等。

**运行数据加密如何配置？**
密钥不是工作流表单字段。平台通过服务端配置 `rag.api.crypto-key` 对输入、变量、触发载荷和节点输出进行 AES-GCM 加密；启用引擎的生产环境必须配置有效的 Base64 密钥。

## 使用边界

- 工作流和资源均按当前租户隔离；节点执行时会再次检查 Skill、RAG、NL2SQL 和 API 的权限。
- API、审批和子流程等资源在发布版本中冻结；资源停用或权限变化可能导致运行时失败，应在发布前完成联调。
- 自动化引擎默认关闭；启用后仍需发布工作流并启用触发器。
