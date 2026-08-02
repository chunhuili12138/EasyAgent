## Overview

**Tool Management** declares existing tenant HTTP interfaces as Agent-callable capabilities: request method, authentication, parameter schema and response mapping, plus who can call and whether human confirmation (HITL) is required. Once configured, the `api` step of a Skill can invoke the tool.

## Roles & Prerequisites

- **Roles**: Agent Admin (`rag:tool:list`).
- **Prerequisites**: External API documentation; target hosts must be in the platform **SSRF allowlist**.

## How to Access

Main menu: **Agent Management → Tool Management**.

## Steps

### 1. Create a Tool

1. Click **Create** to open the editor (three tabs).
2. **Basic info**: name, code, description, URL template (`{{param}}` placeholders), method, operation type, visibility scope and timeout.
3. **Authentication**: choose the auth type and fill in credentials (see reference below).
4. **Parameter schema**: define parameters, headers, request template, success rule and response mapping.
5. Click **Start Test** to verify (dry-run or real request), then save.

### 2. Test the Tool

- **Dry-run (default)**: validates parameters and renders the request without calling the external API;
- **Real request**: send a real request when the toggle is on;
- Results show method, URL, headers, body and response for troubleshooting.

> **Note** Real-request tests actually call external interfaces; use a test environment or off-peak hours.

### 3. Use the Tool

- Select the tool in a Skill's `api` step and configure parameter mapping;
- Tools with operation type **action** force HITL approval before execution.

## Configuration Reference

### Basic Info

| Field | Required | Default | Description |
|---|---|---|---|
| Name | Yes | - | Display name |
| Code | Yes | - | Immutable after save; referenced by Skills/audit |
| Description | Yes | - | When to call and what it returns — helps AI decide |
| URL template | Yes | - | Supports `{{param}}` placeholders |
| Method | Yes | GET | GET / POST / PUT / DELETE |
| Operation type | Yes | Query | query / action (**action forces HITL**) |
| Visibility | Yes | Public | public / department / post / user |
| Authorized object | Per scope | - | Single select department/post/user |
| Timeout | Yes | 10 | 1–60 seconds |
| Retry count | Yes | 0 | 0–2; 0 recommended for non-idempotent operations |

### Authentication

| Type | Credentials |
|---|---|
| None | - |
| Bearer | Token |
| Basic | Username, password |
| API key | Header name (default X-API-Key), key value |
| AK/SK | AccessKey, SecretKey |

On edit, leaving all credentials of a type empty keeps the original; filling any field replaces the whole set.

| Field | Description |
|---|---|
| Propagate identity | Carry the current user context to the external system |
| Identity header | Default `X-Platform-User-Context` |

### Parameter Schema

| Field | Description |
|---|---|
| Parameter schema | JSON Schema: types, meanings, enums, required — for extraction and validation |
| Request headers | Static JSON key-value object (**never store secrets**) |
| Request template | Map validated params to external fields via `{{param}}` |
| Success rule | How to judge success/failure and locate data (see example) |
| Response mapping | `platform field: external response path` key-value pairs |

## Example

Success rule example:

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

Parameter schema example:

```json
{
  "type": "object",
  "required": ["orderId"],
  "properties": {
    "orderId": { "type": "string", "description": "Order number" }
  }
}
```

## FAQ

**Why does the test report "config or parameter validation failed"?**
Check that the parameter schema is valid JSON Schema, template variables match the schema, and credentials are complete.

**Common reasons for external call failures?**
Timeout (1–60s), SSRF allowlist blocking, missing response mapping paths (treated as failure), or wrong credentials.

**Why do some tool calls require approval?**
Tools with operation type "action" always require human confirmation as a security control; it cannot be disabled.

## Tips & Boundaries

- External calls are protected by the **SSRF host allowlist** and redirect-bypass defenses.
- Never store secrets in request headers; use the authentication configuration.
- Before deleting a tool, confirm no Skills reference it, or related Skill steps will fail.
