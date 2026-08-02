## Overview

A **Skill** is a reusable Agent capability: it combines knowledge retrieval, database queries, external APIs, built-in tools, LLM generation, data transformation or batch loops into a dependency-aware execution chain for chat and automation workflows.

Skills support seven step types. Human approval is determined by the operation type of an API tool: an `action` tool enters HITL before execution; a normal Skill step is not a standalone approval step.

## Roles & Prerequisites

- **Roles**: Agent Admin (`rag:skill:list`).
- **Prerequisites**: Prepare a datasource, Schema, API tool or other resource required by the selected step types.

## How to Access

Main menu: **Agent Management → Skill Management**.

## Steps

### 1. Create a Skill

1. Click **Create**.
2. Fill in the name, tenant-unique code, description, trigger keywords, minimum match score and status.
3. Add steps and configure each step's ID, type, description and fields.
4. Add dependencies for steps that must run in sequence; steps without dependencies may run in parallel.
5. Click **Dry-run** to verify the chain, then click **Save**.

### 2. Configure Dependencies

- Use `depends_on` to reference other step IDs; the step runs after all dependencies complete.
- Dependencies cannot be duplicated, reference missing steps or form a cycle.

### 3. Configure Output Structure

- LLM, Transform and other structured steps may define an `output_schema` object.
- Transform steps require input bindings and at least one operation; JSON structure and operation types are validated before saving.

### 4. Use the Skill

- **Chat**: the system selects a Skill using its description, trigger keywords and minimum match score.
- **Automation Center**: bind a saved Skill from a workflow's Skill node.

## Step Types

| Type | Purpose | Key configuration |
|---|---|---|
| `rag` | Retrieve from the current tenant knowledge index | `query` (may reference an upstream step) |
| `nl2sql` | Generate and execute read-only SQL | `datasource_code`, `query_hint` |
| `api` | Call a configured HTTP tool | `tool_code`, `params` or `arguments` |
| `builtin` | Call a built-in tool | `tool_code`, `arguments` |
| `llm` | Standalone LLM generation | `prompt_template`, `temperature` |
| `transform` | Deterministic data transformation | `inputs`/`input`, `operations` |
| `foreach` | Execute an API or built-in tool for each list item | `items`, `body`, `max_items` |

> **Tip** RAG uses the current tenant index and runtime ACL. It does not require a separately created "knowledge base" resource in the Skill form.

## Configuration Reference

### Skill Basics

| Field | Required | Description |
|---|---|---|
| Name | Yes | Skill name shown to administrators and users |
| Code | Yes | Stable, tenant-unique English code used by execution and audit records |
| Description | Yes | Scenario, invocation conditions, result and limitations |
| Trigger keywords | No | Helps chat match the Skill |
| Minimum match score | Yes | The Skill is not selected below this score |
| Status | Yes | Disabled Skills are excluded from later chat and execution |

### Common step fields

Each step should have a valid `id` (starts with a letter and is at most 64 characters), a `type`, and optional `description` and `depends_on`. IDs may contain letters, digits and underscores and must be unique within the Skill.

### Step-specific fields

- **RAG**: use `query` for the retrieval question; it may reference an upstream result with `{{step_id}}`. Runtime ACL filters results.
- **NL2SQL**: `datasource_code` is required; use `query_hint` to describe the query semantics, or put the description in the step `description`.
- **API**: `tool_code` is required; use `params` or `arguments` to bind upstream values. HITL depends on the tool `operationType` (`query`/`action`).
- **Builtin**: `tool_code` must be `current_datetime`, `date_calculate`, `calculator` or `unit_convert`; arguments go under `arguments`.
- **LLM**: `prompt_template` is required and may reference upstream steps; `temperature` must be within the supported range.
- **Transform**: define bindings in `inputs` (or `input`), provide no more than 20 `operations`, and optionally define `output_schema`.
- **Foreach**: `items` must reference a list; `body` must be an `api` or `builtin` step with `body.config.tool_code`. Use `max_items`, `max_attempts` and `continue_on_error` to bound execution.

## Example

The following uses the YAML fields accepted by the Skill page's expert mode. Replace resource codes and prompts with real values:

```yaml
description: Generate an answer using the current time
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
      prompt_template: "Use {{current_time}} to answer the user clearly and accurately."
      temperature: 0.3
```

Minimal NL2SQL and API step example:

```yaml
- id: query_records
  type: nl2sql
  config:
    datasource_code: business_readonly
    query_hint: Return completed records from the last 30 days with id and amount
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

## FAQ

**Why does saving fail with a step configuration error?**
Check the step ID, type, dependencies and type-specific required fields. NL2SQL, API, Builtin, LLM, Foreach and Transform each have dedicated validation.

**What is the difference between dry-run and real execution?**
Dry-run verifies the chain quickly. Real execution also enforces tenant, ACL, quota and tool-operation checks and writes audit records.

**Why are some steps skipped?**
Dependencies, an upstream failure or the upstream failure policy may skip later steps; inspect the execution details.

## Tips & Boundaries

- API `action` tools enter HITL before execution; Skill configuration cannot bypass this gate.
- External APIs are protected by the SSRF host allowlist. NL2SQL permits only read-only single statements and enforces Schema, row and timeout limits.
- Before deleting a Skill, confirm that no automation workflow references it.
