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
2. **Basic info**: name, code, description, endpoint base URL, method, operation type, visibility scope, timeout and retry count. Keep `{{param}}` placeholders only for path parameters.
3. **Authentication**: choose the auth type and fill in credentials (see reference below).
4. **Parameter schema**: define parameters, headers, request template, success rule and response mapping.
5. Click **Save**. Back in the tool list, click **Test** on that row. Run dry-run first, then decide whether a real request is safe.

Prefer separate tools for reads and writes. For example, configure “Get Order” as `query` and “Update Order” as `action`. Never label a write endpoint as a query merely to avoid approval.

### 2. Test the Tool

- **Dry-run (default)**: validates parameters and renders the request without calling the external API;
- **Real request**: send a real request when the toggle is on;
- Test input is initialized from the parameter Schema and can be replaced with realistic boundary values;
- Results show method, URL, ordinary headers, body, mapped response, or error. Authentication and propagated-identity headers are never shown in plain text.

> **Note** A real-request test is sent directly by the Agent administrator. It does not go through chat HITL and does not apply the tool visibility scope to the testing administrator. For action APIs, use a test environment, idempotent input or recoverable data because enabling real request causes the external side effect immediately.

### 3. Use the Tool

- Select the tool in a Skill's `api` step and configure parameter mapping;
- During an interactive chat Skill execution, an **action** tool enters HITL after parameters are assembled and is called only after user confirmation;
- Automation workflows execute API nodes according to the published graph and do not open chat HITL. Add an explicit Wait Event / approval-callback node when external approval is required.
- At runtime, only enabled tools from the current tenant that are visible to the execution user are callable. The administrator's Tool-page test checks tenant ownership but does not simulate an ordinary user's visibility scope.

## Configuration Reference

### Basic Info

| Field | Required | Default | Description |
|---|---|---|---|
| Name | Yes | - | Display name |
| Code | Yes | - | Immutable after save; referenced by Skills/audit |
| Description | Strongly recommended | - | Explain when to call, required input, output and boundaries. It can be saved empty, but Agent selection becomes unreliable |
| URL template | Yes | - | Normally the endpoint base URL; `path` parameters need `{{param}}`. Legacy URL parameter templates remain compatible without duplicate appends |
| Method | Yes | GET | GET / POST / PUT / DELETE |
| Operation type | Yes | Query | query / action (**action forces HITL**) |
| Visibility | Yes | Public | public / department / post / user |
| Authorized object | Per scope | - | Single select department/post/user |
| Timeout | Yes | 10 | 1–60 seconds |
| Retry count | Yes | 0 | 0–2; only idempotent methods such as GET, PUT and DELETE retry on network errors or HTTP 5xx; POST is never retried automatically |

### Authentication

| Type | Credentials |
|---|---|
| None | - |
| Bearer | Token |
| Basic | Username, password |
| API key | Header name (default X-API-Key), key value |
| AK/SK | AccessKey, SecretKey |

On edit, leaving all credentials of a type empty keeps the original; filling any field replaces the whole set.

Actual request headers are:

| Method | Sent value |
|---|---|
| Bearer | `Authorization: Bearer <token>` |
| Basic | `Authorization: Basic <base64(username:password)>` |
| API key | Sends the key using the configured header name |
| AK/SK | Sends `X-Platform-Access-Key`, `X-Platform-Timestamp`, `X-Platform-Nonce`, and `X-Platform-Signature` |

Credentials are encrypted with the platform crypto key at rest and are never returned by detail or edit APIs. When changing the authentication type, provide every field required by the new type.

| Field | Description |
|---|---|
| Propagate identity | Carry the current user context to the external system |
| Identity header | Default `X-Platform-User-Context`; a platform-signed short-lived user context (about 60 seconds) that the external system must verify |

### Parameter Schema

| Field | Description |
|---|---|
| Parameter schema | JSON Schema Draft 7 for logical types, meanings, enums, bounds, and required fields; `x-in`/`in`, `x-http-name`/`httpName`, and `default` declare placement, external names, and defaults |
| Request headers | JSON object. Values may use `{{param}}`. Choosing a preset **replaces** the current header JSON rather than merging it. Never store secrets here |
| Request template | Optional JSON body template. Ordinary values are assembled from the Schema; use it only for nested JSON, fixed fields, or special composition. A whole-value `{{param}}` preserves its type; an embedded placeholder becomes text |
| Success rule | Optional. Empty means any HTTP 2xx succeeds with the full response. Configure status codes, business success and `dataPath` extraction when needed |
| Response mapping | Optional `platform field: external response path` mapping applied after success-rule extraction. A missing path fails the call |

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

`successOperator` supports `equals`, `in`, `exists`, and `not_empty`. When `dataPath` is set, response-mapping paths start at the extracted node. For example, with `"dataPath":"data"`, use `"recordId":"id"`, not `"data.id"`.

Complete parameter schema example:

```json
{
  "type": "object",
  "additionalProperties": false,
  "required": ["orderNo"],
  "properties": {
    "orderNo": {
      "type": "string",
      "description": "Order number",
      "x-in": "path",
      "x-http-name": "orderNo"
    },
    "status": {
      "type": "string",
      "description": "Order status",
      "enum": ["PAID", "SHIPPED", "COMPLETED"],
      "x-in": "query",
      "x-http-name": "order_status"
    },
    "page": {
      "type": "integer",
      "description": "Page number starting from 1",
      "minimum": 1,
      "default": 1,
      "x-in": "query"
    },
    "reason": {
      "type": "string",
      "description": "Reason for the operation",
      "minLength": 2,
      "maxLength": 200,
      "x-in": "body",
      "x-http-name": "operation_reason"
    },
    "requestId": {
      "type": "string",
      "description": "Caller request ID",
      "x-in": "header",
      "x-http-name": "X-Request-Id"
    }
  }
}
```

- A `properties` key is the logical name used by Skills and the Agent.
- `x-in` (or `in`) accepts `query`, `path`, `body`, or `header`. Without it, GET/DELETE default to query and POST/PUT default to body.
- `x-http-name` (or `httpName`) is the external HTTP name; without it, the logical name is reused.
- `default` supplies only a missing value. Optional null or blank-string values are omitted.
- A `path` parameter needs a same-name URL placeholder, for example `https://api.example.com/orders/{{orderNo}}`.

For nested objects or fixed fields, add an optional request template:

```json
{
  "source": "easyagent",
  "operation_reason": "{{reason}}"
}
```

Explicit `body` parameters merge into an object template without overwriting an existing field, so `operation_reason` above is not duplicated. For a flat body, omit the template and let the Schema create `{"operation_reason":"..."}` automatically.

Response mapping example:

```json
{
  "orderId": "order_no",
  "status": "status",
  "message": "message"
}
```

Base URL example:

```text
https://api.example.com/orders/{{orderNo}}
```

At runtime, `orderNo` replaces the path placeholder, `status` is appended as `order_status`, `page` is appended as `page`, and `requestId` is sent as the `X-Request-Id` header. Legacy forms such as `?orderNo={{orderNo}}` remain compatible, and a consumed value is not appended twice.

AK/SK uses the platform's fixed HMAC-SHA256 protocol and automatically sends `X-Platform-Access-Key`, `X-Platform-Timestamp`, `X-Platform-Nonce`, and `X-Platform-Signature`. The algorithm is not configurable in the UI; the external service must implement the EasyAgent verification protocol.

The canonical text joins these values with newline characters in order; an empty query string still occupies its line. `bodySha256` and the signature are lowercase hexadecimal:

```text
accessKey
timestampSeconds
nonce
HTTP_METHOD
rawPath
rawQuery
bodySha256
```

`X-Platform-Signature = hex(HMAC-SHA256(secretKey, canonicalText))`. The external service should also enforce a timestamp window and nonce replay protection, and must never return the SecretKey through APIs or logs.

## FAQ

**Why does the test report "config or parameter validation failed"?**
Check that the parameter schema is valid JSON Schema, template variables match the schema, and credentials are complete.

**Common reasons for external call failures?**
The host is not globally allowlisted, DNS resolves to a local/private address, an authenticated tool uses HTTP, timeout, oversized request or response, a business success-rule mismatch, a missing response-mapping path, or invalid credentials.

**Why can dry-run pass while the real request fails?**
Dry-run validates configuration, parameters, URL, and rendering only. It does not verify the remote endpoint's authentication, business status, or response shape. Enable a real request against safe data, then adjust authentication, success rules, and response mapping from the returned error.

**Why do some tool calls require approval?**
Action tools in interactive chat always require HITL and this cannot be disabled. Real-request tests call immediately, and automation workflows do not show chat confirmation; add an approval wait node to the workflow when approval is required.

## Tips & Boundaries

- External calls are protected by the **SSRF host allowlist** and redirect-bypass defenses.
- Never store secrets in request headers; use the authentication configuration.
- With SSRF protection enabled, authenticated or identity-propagating tools require HTTPS, and hosts resolving to local or private addresses are rejected.
- Request bodies are limited to 512 KB and responses to 1 MB.
- The system blocks deletion while an **enabled Skill** references the tool. A disabled Skill can be left with the old code, so rebind it before enabling it again.
