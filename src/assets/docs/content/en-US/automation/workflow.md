## Overview

**Workflow Design** orchestrates data queries, knowledge retrieval, model generation, deterministic processing, external APIs, and human approval into durable background processes. A workflow follows a **draft -> validate -> publish -> run** lifecycle:

- Designer changes auto-save as a draft after about 1.2 seconds; manual save is also available.
- Validation saves the current draft first, then checks the graph, data contracts, resources, and execution policies.
- Publication freezes a runnable version and its resource information.
- Manual runs and triggers always execute the published version. Unpublished changes never run.

## Prerequisites

- The current tenant has workflow management permission and the server-side automation engine is enabled.
- Required API tools, Skills, datasources, Schemas, and subflows already exist and are enabled.
- Before using an external write operation, confirm test data, rollback, and endpoint idempotency.
- Access path: **Automation Center -> Workflow Design**.

## Recommended Setup Order

### 1. Create the workflow

1. Click **Create**.
2. Use a business-facing name such as "Create refund request" and a stable lowercase code. Do not casually rename the code after other configuration references it.
3. Describe the trigger condition, main processing steps, final output, and unsupported cases.
4. Choose Blank, Sequential, External approval, or Batch. A template only provides a starting structure; real resources and data contracts still need configuration.

### 2. Define workflow input and output

Click blank canvas space and configure **Workflow settings**:

| Setting | Purpose |
|---|---|
| Input | JSON Schema for business input supplied by manual runs or triggers |
| Variables | JSON Schema for runtime variables kept separate from business input |
| Output | JSON Schema for the final workflow result |
| Final output | Mapping array that builds the final result from input, variables, or node output |
| Resources | Frozen binding list maintained automatically when a node resource is selected |

Input, Variables, and Output must be JSON Schema objects. Final output targets must agree with the workflow Output Schema.

### 3. Add and connect nodes

Drag nodes from the library and connect them from Start to End according to real data dependencies. Independent branches can execute concurrently; a node that reads an upstream result must be downstream from it.

Select an edge to configure a condition. Supported forms include:

- Comparison: `workflow.input.amount > 0`
- Path test: `exists(nodes.query.output.rows)` or `is_null(workflow.input.reason)`
- Structured JSON with `and`, `or`, `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `exists`, and `is_null`

A Condition node needs at least two outgoing edges and exactly one **Default branch**. Every non-default edge needs a condition.

### 4. Select managed resources

For API, Skill, Datasource, NL2SQL, or Subflow nodes, select an enabled resource by name. The designer automatically:

1. creates the node `resourceAlias`;
2. adds the matching workflow `resourceBindings` entry;
3. resolves and pins resource ID, code, and available version data at publish time.

Normal setup does not require manual aliases or bindings. If expert JSON editing is unavoidable, the node alias and workflow binding must match exactly.

### 5. Configure node data contracts

Select a node and expand **Advanced data configuration**:

1. **Node config JSON** contains type-specific options such as Transform operations, RAG retrieval settings, or a Batch body.
2. **Input Schema** declares the data shape the node receives.
3. **Input mappings** read values from the workflow, trigger, upstream nodes, or loop context.
4. **Output Schema** declares the required primary output shape.
5. **Output mappings** extract, convert, and rename fields from the `raw` executor result. Leave this empty when raw output already matches the Schema.

Use **Use example** for a starter structure, edit real fields, then click **Apply JSON**. Editor text is not applied to the canvas until that button is clicked.

## Field Mappings

Input, output, and final-output mappings support:

| Field | Description |
|---|---|
| `target` | Target field path |
| `sourceKind` | `PATH` reads a data path; `CONSTANT` uses fixed `value` |
| `source` | Source path for `PATH` |
| `value` | Fixed value for `CONSTANT` |
| `required` | Whether a missing source is required |
| `nullable` | Whether explicit `null` is allowed |
| `defaultValue` | Value used by `missingPolicy=DEFAULT` |
| `conversion` | `STRICT`, `STRING`, `INTEGER`, `LONG`, `DECIMAL`, `BOOLEAN`, `OBJECT`, or `ARRAY` |
| `missingPolicy` | `FAIL`, `OMIT`, `NULL`, or `DEFAULT` |
| `sensitive` | Records mapping sensitivity metadata; runtime payload sanitization is controlled by `sensitive` or `x-sensitive` in JSON Schema |

Common source paths:

- `workflow.input.<field>`: workflow input
- `workflow.variables.<field>`: runtime variables
- `trigger.payload.<field>`: trigger payload
- `nodes.<nodeId>.output.<field>`: upstream node output
- `loop.item`, `loop.index`, `loop.key`: Batch loop context
- `raw.<field>`: raw executor result, only for node output mappings

Mappings never guess fields. For required business values, prefer `required: true` and `missingPolicy: "FAIL"` so an incomplete request cannot be submitted silently.

## Node Behavior and Boundaries

| Node | Configuration and boundary |
|---|---|
| Start / End | Define one entry and at least one exit; Start cannot have incoming edges and End cannot have outgoing edges |
| Condition / Parallel | Condition selects a branch; Parallel starts independent branches |
| Delay | `duration` is a positive ISO-8601 duration such as `PT5M` |
| Wait event | Waits for an external event; approval configuration also requires correlation, timeout, and timeout target |
| Batch loop | `itemsPath` must resolve to an array; supports batch size 1-500, concurrency 1-32, rate limiting, attempts, and failure threshold |
| Aggregate | Merges upstream inputs and requires non-empty input mappings and Output Schema |
| Transform | Supports at most 64 operations: `select`, `remove`, `rename`, `default`, `coerce`, `filter`, `map`, `flatten`, `distinct`, `sort`, `limit`, `compute`, `template` |
| Built-in tool | Only `current_datetime`, `date_calculate`, `calculator`, and `unit_convert`; automation does not support `web_search` |
| Datasource | Returns datasource and authorized Schema catalog metadata; it does not run a SQL query |
| NL2SQL | Binds one Schema and executes an ACL- and Schema-restricted read-only query from input `query` |
| RAG | Searches tenant knowledge under the run identity ACL and does not bind a knowledge-base resource |
| LLM | Requires a non-empty structured Output Schema; supports `maxCompletionTokens`, `minConfidence`, and `confidenceField` |
| Skill | Runs a frozen Skill version; a Skill containing API or foreach-API is rejected |
| Agent | Plans background non-operation capabilities; it fails if clarification is required or the plan contains an API operation |
| API | Executes the bound tool directly without chat HITL. The platform generates an idempotency key, but the external endpoint must enforce idempotency |
| Subflow | Calls another bound, published workflow |

Use explicit API nodes for external writes. Do not hide write operations inside Skill or Agent nodes. Model approval explicitly with a Wait event or let the external business system own the approval.

## LLM Confidence

An LLM node must return JSON matching its Output Schema. When Minimum confidence is set:

1. `minConfidence` is between 0 and 1;
2. `confidenceField` is a simple field name and defaults to `confidence`;
3. the Output Schema must declare that property as `number` or `integer`.

Below-threshold output fails the node and follows its execution failure policy.

## First External Approval Setup

An Approval Provider can only reference a **published workflow**, while an approval Wait node needs that provider ID. Bootstrap it in this order:

1. Design and publish a base version. Leave Approval provider ID empty so the Wait event remains a generic wait.
2. Open **Trigger Management**, create an **Approval Provider** for that published workflow, and keep it disabled.
3. Copy its ID from the provider list.
4. Return to the workflow draft and fill Provider ID, Correlation key path, `PT1M` to `P30D` timeout, and **Timeout target**.
5. Use a correlation path that uniquely identifies the business subject, such as `workflow.input.refundNo`.
6. Validate and republish, then enable the Approval Provider.

Branch explicitly on approved/rejected callback data. Timeout target is a separate route and does not need another normal edge from the Wait node.

## Execution Policy

```json
{
  "maxRetries": 2,
  "retryDelay": "PT10S",
  "timeoutMs": 60000,
  "failurePolicy": "FAIL_WORKFLOW"
}
```

- `maxRetries`: 0-10.
- `retryDelay`: positive ISO-8601 duration.
- `timeoutMs`: 100-3600000 milliseconds.
- `failurePolicy`: `FAIL_WORKFLOW` terminates; `ERROR_BRANCH` routes to `failureTarget`.
- `failureTarget` must be another existing node.

Retry a side-effecting API only when the external endpoint is idempotent. Otherwise, retries may duplicate creation, payment, or notification.

## Linear Example: Create a Refund Request

Goal: read one refundable order, generate a refund reason, build the request, and call the refund API.

1. Declare a string `query` in workflow Input Schema.
2. Add NL2SQL and select the order Schema. Map `workflow.input.query` to node input `query`.
3. Add LLM downstream from NL2SQL. Map the order result into LLM input and declare string `refundReason` in Output Schema.
4. Add Transform. Map the order result and `nodes.<llmId>.output.refundReason`; use `template` or `select/rename` to build `orderNo`, `amount`, and `reason`, with a non-empty Output Schema.
5. Add API and select the Create refund request tool. Map the Transform result into API input.
6. Connect End, configure retry and failure routes, validate, and publish.
7. Use **Run published version** with real test input. Reconcile every node output with the external business record in Runs and Execution Logs.

The API node performs a real request. If approval is required, insert a Wait event before API and complete the two-publication bootstrap above.

## Validate, Publish, and Run

Before publication, confirm:

- exactly one Start, at least one End, every node reachable, and a route from every node to an End;
- unique node and edge IDs and no unsupported cycle;
- condition, failure, and approval-timeout targets reference valid nodes;
- every managed resource is selected and matches the node type;
- Schemas, mappings, and type-specific config are complete;
- external APIs have been tested and retries cannot duplicate side effects.

**Validate** saves the draft first. After publication, **Run published version** creates a real run and calls real nodes. If a newer draft exists, the run dialog states that it will still execute the older published version.

## FAQ

**Why did my draft change not affect the result?** Runs only use published versions. Validate and publish again.

**Why does Transform or Aggregate require outputSchema?** Both require non-empty input mappings and a non-empty Output Schema. Operations alone are insufficient.

**Why is no alias entry required after selecting a resource?** The designer creates both the node alias and workflow binding. Editing only one side causes publication validation to fail.

**Why did Datasource return no query rows?** It only exposes datasource and authorized Schema catalog metadata. Use NL2SQL bound to a specific Schema for a business query.

**Why can an automation Skill or Agent not call an API?** Background automation has no chat HITL. APIs must remain explicit so operations, approval, and audit are visible.

**Why did a manual run create real data?** It is not preview mode. It executes every node in the published version; use test endpoints and recoverable data.

## Security Boundaries

- Workflows and resources are tenant-scoped. Runtime rechecks ACL and resource state under the initiating identity.
- A frozen resource version is not permanently available; disablement, permission changes, or expired credentials can still fail a run.
- The server uses `rag.api.crypto-key` for AES-GCM encryption of inputs, variables, trigger payloads, and node output. It is not a page field.
- Engine enablement, workflow publication, and trigger enablement are independent requirements.
