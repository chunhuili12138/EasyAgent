## Overview

A **Skill** is a reusable, controlled Agent execution chain. It combines knowledge retrieval, read-only data queries, external APIs, built-in tools, LLM generation, deterministic transformation, and batch loops into a dependency-aware DAG for Chat or Automation Center.

A Skill has one of three intent types and may use seven step types. The intent type guides chat routing; the steps define what is actually executed. Keep them consistent.

## Roles and Prerequisites

- **Role**: an Agent configurator with `rag:skill:list`.
- **Prerequisites**: save and test the required data sources, Schemas, and API tools first. For knowledge Skills, ensure the relevant documents have been processed and indexed.

## Access

Main menu: **Agent Management → Skill Management**.

## Recommended Setup Flow

1. Click **Create** and choose the template closest to the business goal.
2. Enter a name, unique code, capability description, and intent type.
3. Configure trigger words, positive examples, exclusion examples, and minimum confidence.
4. Split the task by outputs and configure each step's ID, type, description, dependencies, and type-specific fields.
5. Use **Trial Run Current Config** to inspect every step. YAML changes must be **Applied to Form** before they can be saved.
6. Save and enable the Skill, then use **Match Test** for rule matching.
7. Finally, use natural multi-turn business requests in Chat to validate routing, permissions, clarification, HITL, and result presentation.

## Basic Fields

| Field | Required | Description |
|---|---|---|
| Name | Yes | Business-readable name shown to configurators and users |
| Code | Yes | Stable tenant-unique code containing letters, digits, and underscores |
| Description | No, strongly recommended | Scenario, required input, main output, and boundaries; an empty description makes Agent selection less reliable |
| Intent type | Yes | `knowledge`, `action`, or `composite` |
| Trigger words | No | Comma-separated intent phrases; at least one trigger must match before the chat semantic fallback can consider this Skill |
| Positive examples | No | One expected request per line; a substring rule match raises the rule score to 1.0 |
| Exclusion examples | No | One similar request that must not run the Skill per line; a substring match sets the rule score to 0 |
| Minimum confidence | Yes | UI range 0.50–1.00 in 0.05 steps; default 0.65 |
| Status | Yes | Only enabled Skills enter chat routing and the executable catalog |

### Choosing an Intent Type

- **Knowledge Answer**: primarily answers from knowledge evidence and does not change external business state.
- **Data Query or Tool Action**: performs NL2SQL, built-in, or API work and is treated as an operational capability by routing.
- **Multi-step Composite Task**: combines several query, transform, call, and summary stages.

Intent type does not create or restrict steps. The backend infers it for legacy Skills without a value, but new Skills should set it explicitly.

### Positive and Exclusion Examples

Use complete phrases a real user would say, not broad words such as “query” or “process.” Positive examples describe requests that should run the Skill; exclusion examples separate similar requests that must not. Exclusions take precedence over triggers and positive examples.

## Step Types

| Type | Purpose | Key configuration |
|---|---|---|
| `rag` | Search the current tenant knowledge index | `query`; blank uses the current user request |
| `nl2sql` | Generate and execute read-only SQL | `datasource_code`, `query_hint` |
| `api` | Call a configured HTTP tool | `tool_code`, `params` or `arguments` |
| `builtin` | Date, calculation, conversion, or web search | `tool_code`, `arguments` |
| `llm` | Generate content from the request and upstream results | `prompt_template`, `temperature` |
| `transform` | Deterministic mapping, filtering, aggregation, and assembly | `inputs`/`input`, `operations` |
| `foreach` | Run an API or built-in tool for each list item | `items`, `body`, `max_items` |

### Common Step Fields

- `id`: starts with a letter, uses at most 64 letters, digits, or underscores, and is unique within the Skill.
- `description`: states the step output and success criteria. NL2SQL uses it when `query_hint` is blank.
- `depends_on`: upstream step IDs that must complete first. Dependencies must exist and cannot form a cycle; independent steps may run in parallel.
- `output_schema`: optional JSON Schema for RAG, NL2SQL, API, built-in, or LLM. A mismatch stops downstream execution; an LLM with a Schema must return conforming JSON.

### RAG

Leave `query` blank to use the current request, or provide fixed text or an upstream reference. Retrieval always uses the current tenant index and runtime user ACL. No separate knowledge-base resource is selected in the Skill form.

### NL2SQL

Select an enabled data source. `query_hint` should state entities, filters, time range, metric definitions, and returned fields; the executor does not append the current user request automatically. Runtime still enforces the current user's Schema ACL, read-only SQL, row limit, and timeout.

### API

Select an enabled tool available to the current user. Enter literals directly; upstream bindings must define `source`, restricted JSONPath, `one`/`many` cardinality, and empty, multiple, and overflow policies. Runtime does not guess same-name fields or silently select the first row.

In Chat, an `action` tool freezes the request and enters HITL. A standalone Skill trial run cannot complete chat approval. Automation Skill nodes currently reject Skills containing API calls; use an Automation API node and an explicit wait-event or approval callback when the workflow needs approval.

### Built-in

The normal form offers `current_datetime`, `date_calculate`, `calculator`, and `unit_convert`.

Expert YAML also supports `web_search`. It requires Tavily backend configuration and accepts `query`, `topic`, `search_depth`, `max_results`, and `time_range`. It cannot run inside `foreach`; follow it with an LLM step to synthesize results while preserving source links.

### LLM

`prompt_template` is required, and every referenced upstream step must also be a dependency. Supported forms are:

- `{{step_id}}` for the complete output;
- `{{step_id.path}}` or `{{step_id.$.path}}` for an upstream field;
- `{{#each step_id}}...{{this.field}}...{{@index}}...{{/each}}` for a read-only array loop; nested loops are not supported.

The current user request is also appended to the LLM context. Use Transform, not the LLM, for field mapping, money calculations, filtering, and aggregation.

### Transform

Bind structured upstream data through `input` or `inputs`, then configure at most 20 operations: `select`, `filter`, `project`, `rename`, `distinct`, `sort`, `slice`, `limit`, `aggregate`, `object`, `merge`, `default`, and `cast`. `limit` is a bounded list-slice alias and accepts `limit` or `count`.

Paths are limited to `$`, fields, numeric indexes, and array wildcards. Runtime limits are 200 items, 1 MB JSON, and 32 levels of nesting. Scripts, network access, and file access are not supported.

### Foreach

`items` references an upstream array, with optional `item_path`; `body` supports only `api` or ordinary `builtin`. The body may use `{{item}}`, `{{item.id}}`, and `{{index}}`. `max_items` cannot exceed 200, and `continue_on_error` controls whether execution continues after an item fails. Web search is not allowed in a loop.

## What the Test Actions Actually Do

### Match Test

Match Test checks local rules for **saved, enabled** Skills only: exclusion examples, positive examples, trigger words, and minimum confidence. It does not test unsaved editor content or the LLM semantic fallback used by Chat. A no-match does not prove Chat will never select the Skill, and a match does not prove its execution chain succeeds.

### Trial Run Current Config

Trial Run can execute the unsaved definition currently in the editor:

- with action checking disabled, `action` API steps return a dry-run skip and do not call the endpoint;
- with action checking enabled, standalone execution has no chat session, so the HITL gate cancels the action and still does not call the endpoint;
- query APIs, RAG, NL2SQL, built-ins, and LLM steps may still access real endpoints, databases, models, or indexes.

To test a real action, save the Skill and complete HITL in Chat. A tool's own Real Request test bypasses chat HITL and must be used only with test or recoverable data.

## YAML Example

```yaml
description: Query after-sales records and produce a readable conclusion
intent_type: composite
positive_examples:
  - Check whether this after-sales request follows policy
negative_examples:
  - Explain the policy only; do not query my records
steps:
  - id: query_records
    type: nl2sql
    description: Query after-sales records visible to the current user
    config:
      datasource_code: business_readonly
      query_hint: Return the records relevant to the request with id, status, amount, and created_at
  - id: generate_answer
    type: llm
    depends_on: [query_records]
    config:
      prompt_template: |
        Answer from the query result and identify missing fields instead of guessing.
        {{#each query_records}}
        - ID: {{this.id}}, status: {{this.status}}, amount: {{this.amount}}
        {{/each}}
      temperature: 0.2
```

## Saving, Disabling, Deleting, and Automation References

- Saving validates IDs, dependencies, type-specific fields, JSON/YAML, and execution limits. It does not prove business correctness.
- Disabling removes a Skill from routing while retaining its configuration for later re-enabling. Deleting permanently removes the Skill configuration and cannot be undone; historical runs remain.
- Check workflow references manually before deletion. Deletion does not currently block on an Automation reference, so later workflow runs may fail.
- Workflow publication freezes the Skill version and YAML. Automation Skill nodes are for Skills without API calls; use explicit API nodes for external calls.

## Security Boundaries

- Data sources, Schemas, tools, and retrieval remain tenant- and execution-identity-scoped.
- NL2SQL permits only controlled read-only single statements.
- External APIs remain subject to authentication, parameter Schema, SSRF egress policy, timeouts, and audit.
- A Skill cannot bypass chat HITL or disguise a side-effecting operation as a query.
