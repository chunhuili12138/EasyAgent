## Overview

**Trigger Management** configures workflow entry points. Schedules, webhooks, and internal events start workflows. An **approval provider does not start a workflow**; it receives an external decision and uses `correlationKey` to resume a run already waiting at an approval node.

New records are disabled after saving. Verify the configuration and integration before enabling them.

## Choose a Type

| Requirement | Type | Initiator | Starts a new run |
|---|---|---|---|
| Run on a calendar schedule | Schedule | EasyAgent scheduler | Yes |
| Receive a public third-party notification | Webhook | Signed external POST | Yes |
| Publish an event inside EasyAgent | Internal event | Authenticated platform API | Yes |
| Return a decision for an existing approval | Approval provider | Signed external POST | No; resumes a wait |

Use a Webhook when a third-party system must start a process. Do not use an approval provider as a Webhook.

## Roles and Prerequisites

- **Role**: A tenant Agent administrator with trigger view or management permission.
- **Common prerequisite**: The automation engine is enabled and the target workflow is published. Only published workflows appear in the selector.
- **External callback prerequisite**: The calling system can preserve the exact JSON body and calculate an HMAC-SHA256 signature.

## Access

Main menu: **Automation Center -> Trigger Management**.

Use the top switch to select **Schedule / Webhook / Internal Event / Approval Provider**. Workflow columns show the name and code instead of a database ID.

## Common Creation Flow

1. Validate and publish the workflow in **Workflow Design**.
2. Open **Trigger Management** and select the correct type.
3. Click **New**, select the workflow, and enter a business-facing name.
4. Complete the type-specific configuration below and click **Save**.
5. Review the configuration summary. New records are disabled; enable the record only after verification.

Each fire uses the workflow version published at that time. Republishing does not require recreating the trigger.

## Configure a Schedule

1. Select **Schedule** and click **New Schedule**.
2. Choose a published workflow and enter a name.
3. Choose a frequency preset, or enter a custom Spring Cron expression.
4. Select an IANA timezone such as `Asia/Shanghai`.
5. Set the misfire window and overlap policy.
6. Enter JSON objects under **Workflow input** and **Run variables**. Use the example buttons for a starter structure.
7. Save, verify Cron, timezone, overlap, and next-run time, then enable it.

### Schedule Fields

| Field | Range/example | Meaning |
|---|---|---|
| Spring Cron | `0 0 9 * * *` | Six fields: second, minute, hour, day, month, weekday |
| IANA timezone | `Asia/Shanghai` | Used by the scheduler to calculate fire times |
| Misfire window | 0-86400 seconds | Maximum delay that may be compensated after recovery; `0` disables compensation |
| Overlap policy | `SKIP`, etc. | Handles a new fire while this trigger has an active run |
| Workflow input | JSON object | Static `workflow.input` for every run; must match the workflow Input Schema |
| Run variables | JSON object | Static `workflow.variables`, suitable for environment, operator, and switch values |

Common expressions:

| Frequency | Cron |
|---|---|
| Every 5 minutes | `0 */5 * * * *` |
| Hourly | `0 0 * * * *` |
| Daily at 09:00 | `0 0 9 * * *` |
| Monday at 09:00 | `0 0 9 * * MON` |
| Day 1 at 09:00 | `0 0 9 1 * *` |

The “Every 30 days” preset actually runs on day 1 of each month; it is not a strict 30 x 24-hour interval.

### Overlap Policies

| Policy | Behavior | Guidance |
|---|---|---|
| `SKIP` | Skip a fire while a run is active | Default for work that must not overlap |
| `QUEUE` | Coalesce into one run after the active run | Use when delay is acceptable but an opportunity should not be lost |
| `PARALLEL` | Run concurrently | Only for concurrency-safe workflows |
| `REPLACE` | Cancel the active run and start the new one | Use external writes carefully; assess partial side effects |

## Configure a Webhook

A Webhook lets a third-party system start a workflow with a signed POST.

1. Select **Webhook** and click **New Webhook**.
2. Choose a published workflow and enter a name.
3. Set a 30-3600 second signature window. Smaller windows reduce replay exposure but require synchronized clocks.
4. Define the external JSON body under **Payload Schema**.
5. Configure static **Workflow input** and **Run variables**.
6. Save the public key, callback path, and signing secret from the one-time dialog.
7. Prefix the relative callback path with the externally reachable backend origin, test a signed request, then enable the Webhook.

The body is not merged into `workflow.input`. Workflow nodes read it from `trigger.payload.<field>`, for example `trigger.payload.orderNo`.

### Payload Schema Example

```json
{
  "type": "object",
  "required": ["orderNo", "approvedAt"],
  "properties": {
    "orderNo": { "type": "string" },
    "approvedAt": { "type": "string" }
  }
}
```

A body that fails the Schema returns `422` and does not start a workflow.

## Configure an Internal Event

Internal events are published by an authenticated EasyAgent API. They are not public third-party Webhooks.

1. Select **Internal Event** and click **New Internal Event**.
2. Choose a published workflow and enter a name.
3. Enter a stable event type such as `after_sales.refund_approved`.
4. Define the business `payload` under **Payload Schema**.
5. Configure static workflow input and variables, save, and enable the trigger.
6. Call `POST /api/automation/events` as an `AGENT_ADMIN` or `SYS_ADMIN` in the same tenant.

Event types are normalized to lowercase and must match `[a-z][a-z0-9._:-]{2,99}`. Example request:

```json
{
  "eventId": "refund-approved-RF20260805001",
  "eventType": "after_sales.refund_approved",
  "occurredAt": "2026-08-05T09:30:00Z",
  "payload": {
    "refundNo": "RF20260805001",
    "orderNo": "SO20260801018"
  }
}
```

The full envelope is at `trigger.payload`: event metadata is at `trigger.payload.eventId`, while business data is under `trigger.payload.payload`. The order path is therefore `trigger.payload.payload.orderNo`.

## Configure an Approval Provider

An approval provider handles the case where a running workflow reaches a wait node and a third-party system returns the decision later. It does not create a new run.

Because the provider must target a published workflow and the wait node needs the provider ID, use this bootstrap sequence:

1. Publish a usable base workflow version.
2. Open **Trigger Management -> Approval Provider**, create a provider, and leave it disabled.
3. Save the **Approval provider ID**, public key, callback path, and signing secret from the one-time dialog.
4. Return to **Workflow Design** and configure the approval wait with the provider ID, unique correlation path, timeout, and timeout target.
5. Validate and republish the workflow.
6. Return to Trigger Management and enable the provider.
7. Start a run, wait until it reaches the approval node, then send a signed callback.

The callback body contains at least:

```json
{
  "correlationKey": "refund-RF20260805001",
  "status": "APPROVED"
}
```

- `correlationKey` must exactly match the value registered by an active wait. It is 1-128 characters and allows letters, digits, dots, colons, underscores, and hyphens.
- `status` supports only `PENDING`, `APPROVED`, and `REJECTED`; input is case-insensitive.
- `PENDING` records the decision but keeps waiting. `APPROVED` and `REJECTED` resume their configured branches.

A callback without a matching active wait returns `404`. Check the provider ID, correlation key, tenant, and whether the wait already ended.

## Webhook and Approval Signing

Both callback types use the same protocol and accept JSON bodies up to 1 MB. Send all three headers:

| Header | Content |
|---|---|
| `X-Automation-Timestamp` | Current Unix timestamp in seconds |
| `X-Automation-Event-Id` | Unique event ID, 1-128 allowed characters |
| `X-Automation-Signature` | `v1=` followed by an HMAC-SHA256 hex digest |

Sign the **exact raw bytes** sent in the request:

```text
timestamp + "." + eventId + "." + rawBody
```

Calculation:

```text
signature = "v1=" + hex(HMAC-SHA256(signingSecret, signingText))
```

Do not parse and reserialize JSON after signing. Spaces, newlines, or field-order changes alter the signature. Synchronize external hosts with NTP and send requests within the configured signature window.

## Data Locations

| Source | Workflow path | Automatically merged |
|---|---|---|
| Configured workflow input | `workflow.input` | Separate object |
| Configured run variables | `workflow.variables` | Separate object |
| Webhook JSON body | `trigger.payload` | No |
| Internal-event metadata | `trigger.payload.eventId/eventType/occurredAt` | No |
| Internal-event business data | `trigger.payload.payload` | No |
| Schedule metadata | `trigger.payload.scheduledAt/triggerId` | No |

Map external fields explicitly in Workflow Design. Do not duplicate placeholder external data in static input.

## Enable, Disable, and Rotate

- **Enable**: Accept new schedules or requests. The target must still have a published version.
- **Disable**: Stop accepting new work; existing runs are not cancelled automatically.
- **Rotate Secret**: Available for Webhooks and approval providers. The old secret becomes invalid immediately, so update the caller at once.
- Public keys and callback paths route requests and may be shared with callers. Store signing secrets in a secret manager, never in logs, workflow parameters, or ordinary documents.

## Acceptance Checks

### Schedule

1. After enabling, verify a reasonable next-run time.
2. At that time, find a new Workflow Run and verify its trigger type and workflow.
3. Confirm misfire and overlap behavior.

### Webhook

1. Send one valid signed request. The first response is `202` and contains a run ID.
2. Repeat the same event ID with the exact same body. It returns `200` and the original run.
3. Reuse the event ID with a different body. It returns `409`.
4. Verify node mappings read the expected `trigger.payload` fields.

### Internal Event

1. After publishing, inspect the Outbox state in **Event Records**.
2. Wait for asynchronous matching, then confirm the workflow run.
3. Verify business mappings use `trigger.payload.payload.<field>`.

### Approval Provider

1. Confirm the workflow reaches the approval wait first.
2. Send `PENDING` with the matching `correlationKey`; the workflow keeps waiting.
3. Send a new event ID with `APPROVED` or `REJECTED`; the workflow follows that branch.
4. Verify wait, callback, and resume order in the run timeline and event records.

## FAQ

**Why is the workflow missing from the selector?**
Only published workflows are loaded. Validate and publish it in Workflow Design, then refresh this page.

**Why did nothing run after saving?**
New records are disabled. Verify and enable the record. For a Schedule, also check timezone and next-run time.

**Why does a Webhook report a signature error?**
Check all headers, Unix seconds, public key, active secret, and exact body bytes. Do not format JSON after signing it.

**Why can workflow input not see the Webhook field?**
Static input and external body are separate objects. Read static values from `workflow.input` and Webhook data from `trigger.payload`.

**Why did an internal event not create a run immediately?**
It first enters the Outbox and is matched asynchronously. Inspect Event Records for receipt, matching, and failure states.

**Why did an approval callback not start a workflow?**
This is expected. An approval provider only resumes an existing wait. Use a Webhook to start a new process externally.

**May an event ID be reused?**
The same ID and identical content return the original result. The same ID with different content conflicts. Use a new stable ID for each new business event.

## Boundaries

- Triggers run only the latest published workflow version; drafts never execute.
- Webhook and approval endpoints accept JSON POST bodies up to 1 MB.
- Internal events require authenticated same-tenant authority and do not replace signed third-party Webhooks.
- Parallel and replacement policies do not make external APIs idempotent. Workflows that create records or refunds still require idempotency protection in the external API.
- Do not delete failed events or runs to obtain a green result. They are evidence for diagnosing signature, Schema, mapping, and external-system failures.
