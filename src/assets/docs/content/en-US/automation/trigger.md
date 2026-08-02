## Overview

**Trigger Management** configures execution entries for published workflows: Cron, webhooks, internal events, and approval callbacks. Triggers can be enabled or disabled, while webhook and approval callbacks use signature secrets to prevent forged requests.

## Roles & Prerequisites

- **Role**: An Agent administrator with trigger view/manage permissions.
- **Prerequisites**: A workflow exists; it must be published before its trigger can be enabled, and the automation engine must be enabled.

## How to Access

Main menu: **Automation Center → Trigger Management**.

## Steps

### 1. Create a Trigger

1. Select **Cron / Webhook / Internal Event / Approval Provider** at the top.
2. Click **Create**, select the workflow, and enter a name.
3. Fill in the type-specific Cron, schema, event-type, or signature-window settings, plus optional workflow input and runtime-variable JSON objects.
4. Save and enable the trigger. After creating or rotating a webhook/approval secret, copy it from the one-time dialog immediately.

### 2. Enable, Disable, and Rotate

- Disabling stops new runs; existing runs are not cancelled.
- For webhooks and approvals, use **Rotate Secret**. The old secret becomes invalid immediately and must be replaced in the external system.

## Configuration Reference

### Common fields

| Field | Description |
|---|---|
| Workflow | Target workflow; it must be published when the trigger is enabled |
| Name | Trigger name, up to 100 characters |
| Workflow input | JSON object used as initial workflow input |
| Runtime variables | JSON object used as workflow variables |

### Cron

| Field | Default/range | Description |
|---|---|---|
| Cron expression | `0 0 * * * *` | Six-field Spring Cron: second, minute, hour, day, month, weekday |
| Timezone | `Asia/Shanghai` | IANA timezone used to calculate the next fire |
| Misfire window | 300 seconds, 0–86400 | Allows a missed fire to run within the window after a temporary outage |
| Overlap policy | `SKIP` | `SKIP`, `QUEUE`, `PARALLEL`, or `REPLACE` |

Cron creates workflow runs directly and does not write an event record.

### Webhook / Approval

| Field | Default/range | Description |
|---|---|---|
| Signature time window | 300 seconds, 30–3600 | Requests with an older signature are rejected |
| Payload/callback schema | JSON Schema object | Validates the callback payload; approval defaults require `correlationKey` and `status` |

Secrets are shown once only. Rotate a lost secret instead of storing plaintext in ordinary configuration or logs.

### Internal event

| Field | Description |
|---|---|
| Event type | For example `after_sales.acceptance`; normalized to lowercase when saved and matched |
| Payload schema | JSON Schema object used to validate the event payload |

### Overlap policy

| Policy | Behavior |
|---|---|
| `SKIP` | Skip a fire while an active instance exists |
| `QUEUE` | Run once after the active instance completes |
| `PARALLEL` | Allow concurrent runs |
| `REPLACE` | Terminate the active instance and replace it |

## FAQ

**Why is my workflow missing from the selector?**
Only non-archived workflows can be edited, and a workflow must be published before its trigger can be enabled.

**Why does an uppercase event type still match?**
The platform normalizes event types to lowercase. Use the same lowercase name in configuration, publish requests, and external systems to avoid cross-system naming mistakes.

**I lost the webhook secret.**
Click **Rotate Secret**, then update the external system with the new secret, public key, and callback path.

**Do I need to recreate a trigger after publishing a workflow again?**
No. The trigger uses the workflow’s latest published version on its next fire.

## Boundaries

- Webhook and approval callback paths, public keys, and secrets are sensitive and delivered through a one-time dialog.
- Cron uses the configured IANA timezone; the next-fire time can differ from the server’s local timezone.
- Event triggers match normalized lowercase event types and remain tenant-scoped.
