## Overview

The **Automation Center** provides a visual workflow designer. Nodes, edges, and frozen resource bindings combine AI capabilities, business APIs, and human approvals into durable workflows triggered by Cron, webhooks, internal events, or approval callbacks.

Workflows use a **draft → validate → publish** lifecycle. A published version is immutable; runs always use the published version, so editing a draft cannot change an existing run.

## Roles & Prerequisites

- **Role**: An Agent administrator with workflow view/manage permissions.
- **Prerequisites**: The platform administrator has enabled the automation engine. Create the required Skill, datasource, Schema, API, or sub-workflow before binding it.

## How to Access

Main menu: **Automation Center → Workflow Design**.

## Steps

### 1. Create and Design

1. Click **Create**, enter the name, code, and description, and choose a blank or template flow.
2. Drag nodes onto the canvas and connect the start, business, and end nodes.
3. Choose a `resourceAlias` for nodes that use external resources, then declare the matching binding at workflow level.
4. Use the advanced JSON editors for input/output/variable schemas and field mappings. Use the variable tree for valid paths.

### 2. Validate and Publish

1. Click **Validate** to check node types, schemas, resource bindings, edges, acyclicity, and data contracts.
2. Fix all errors and click **Publish** to create a frozen runnable version.
3. Open **Trigger Management** to configure Cron, webhook, internal-event, or approval triggers for that version.

### 3. Run and Monitor

1. Click **Run** in the workflow detail, provide workflow input and runtime variables, and remember that manual runs call real nodes.
2. Use **Run Instances** for flow status and final output, and **Execution Logs** for every node attempt.
3. A node that exhausts its retry policy creates a **Failure Task**. Open dead letters can be retried or discarded.

## Node Types

| Type | Purpose |
|---|---|
| Start / End | Define workflow entry and exit |
| Condition / Parallel | Branch or execute paths concurrently |
| Delay / Wait event | Wait for time, an internal event, a webhook, or an approval result |
| Batch loop | Read an array and execute one item node in batches |
| Aggregate / Transform | Merge branches, filter, rename, convert, or template data |
| Built-in tool | Call `current_datetime`, `date_calculate`, `calculator`, or `unit_convert` |
| Datasource / RAG / LLM / NL2SQL | Use bound data and AI capabilities |
| Skill / Agent | Invoke a configured Skill or Agent task |
| API | Call a bound API tool |
| Sub-flow | Call a bound workflow |

## Definition Shape (schemaVersion 2)

The designer stores a JSON definition, not the old `name/trigger/config` YAML format. The main fields are:

| Field | Description |
|---|---|
| `schemaVersion` | Must be `2` for the current data-contract model |
| `nodes` | Nodes with `id`, `type`, `name`, `config`, input/output schemas, field mappings, and `executionPolicy` |
| `edges` | Edges with `id`, `source`, `target`, optional `condition`, and `defaultBranch` |
| `inputSchema` | JSON Schema for workflow input from triggers or manual runs |
| `variablesSchema` | JSON Schema for runtime variables |
| `outputSchema` | JSON Schema for the final workflow output |
| `finalOutput` | Maps `workflow.input`, `workflow.variables`, or `nodes.<id>.output` into the final result |
| `resourceBindings` | Frozen resources. Each entry needs a valid `alias`, `resourceType`, and positive `resourceId`; `resourceCode`, `resourceVersion`, and `constraints` are optional |
| `policies` | Workflow/designer metadata; retry and failure behavior belongs to each node's `executionPolicy` |

### Resource aliases

Put `resourceAlias` in the node `config` and make it match `resourceBindings[].alias`. The resource type must match the node: API → `api`, Skill → `skill`, datasource → `datasource`, NL2SQL → `schema`, and sub-flow → `workflow`. Published definitions freeze resource IDs/versions; runtime input cannot replace them.

### Node execution policy

```json
{
  "maxRetries": 2,
  "retryDelay": "PT10S",
  "timeoutMs": 60000,
  "failurePolicy": "FAIL_WORKFLOW"
}
```

`maxRetries` is 0–10, `retryDelay` is a positive ISO-8601 duration, and `timeoutMs` is 100–3600000. `failurePolicy` is `FAIL_WORKFLOW` or `ERROR_BRANCH`; the latter requires a `failureTarget` pointing to another node.

### Common node configuration

- **Delay**: `config.duration`, for example `PT5M`.
- **Wait event**: optional `eventSchema`; an external approval wait also needs `approvalProviderId`, `correlationKeyPath`, and `approvalTimeout`.
- **Batch loop**: `itemsPath`, `batchSize` (1–500), `maxConcurrency` (1–32), `rateLimitPerSecond`, `maxAttempts`, `failureThreshold`, and `body`.
- **LLM**: requires a node `outputSchema`; supports `maxCompletionTokens`, `minConfidence`, and `confidenceField`.
- **Transform**: `operations` is an array supporting select, remove, rename, default, coerce, filter, map, flatten, distinct, sort, limit, compute, and template.

## Minimal Definition Example

This example shows the real field shape. Use the designer to create the complete flow and validate it before publishing:

```json
{
  "schemaVersion": 2,
  "nodes": [
    {"id": "start", "type": "start", "name": "Start", "config": {}},
    {"id": "now", "type": "builtin", "name": "Get time", "config": {"toolCode": "current_datetime", "resourceAlias": null}},
    {"id": "end", "type": "end", "name": "End", "config": {}}
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

## FAQ

**Why can’t I publish?**
Validate first. Check for exactly one start node, at least one end node, unique node/edge IDs, reachable nodes, no cycles, valid schemas, and matching resource aliases.

**Why did editing the draft not change the run?**
Runs use the published version. Validate and publish again before the next trigger uses the new definition.

**How do I handle a failure task?**
Review its `reasonCode` and status. An open dead letter can be retried to create a new run or discarded. Confirm that external operations are idempotent before retrying.

**How is runtime data encryption configured?**
It is not a workflow form field. The server uses `rag.api.crypto-key` to AES-GCM encrypt inputs, variables, trigger payloads, and node outputs. Production engine deployments must provide a valid Base64 key.

## Boundaries

- Workflows and resources are tenant-scoped. Skill, RAG, NL2SQL, and API permissions are checked again at node execution.
- API, approval, and sub-workflow resources are frozen in a published version; a disabled resource or changed permission can still make a run fail.
- The automation engine is disabled by default. After enabling it, publish the workflow and enable its trigger.
