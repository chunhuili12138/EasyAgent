## Overview

**Event Records** is a read-only diagnostic view for the automation event path:

- **Published (Outbox)** records only internal events as they enter the publication queue and finish dispatch.
- **Received (Inbox)** records matching, workflow startup, or approval resumption after internal events, webhooks, and approval callbacks pass entry validation.

Scheduled triggers bypass Inbox/Outbox and create runs directly. Inspect scheduled executions in **Run Instances** and **Execution Logs**.

## Roles and Prerequisites

- **Role**: An Agent administrator with Event Records permission.
- **Prerequisites**: An internal event has been published, or an Internal Event, Webhook, or Approval Provider is configured and enabled.
- This page is read-only. It does not resend events, start runs, or change triggers.

## How to Access

Main menu: **Automation Center → Event Records**.

## Recommended Troubleshooting Flow

### 1. Choose the direction first

- To confirm that an internal event was dispatched, select **Published**.
- To check whether an event was received, matched, started a workflow, or resumed an approval wait, select **Received**.

Switching direction clears incompatible status and source filters so an Inbox status cannot accidentally filter Outbox, or vice versa.

### 2. Apply direction-specific filters

Both directions support event type and status filters. Received also supports source filtering:

| Source | Meaning |
|---|---|
| `INTERNAL` | An event published inside the platform |
| `WEBHOOK` | A request sent by an external system to a Webhook trigger |
| `APPROVAL` | A callback sent by an external approval provider |

Event types are normalized to lowercase for storage and matching. Prefer lowercase letters, digits, dots, colons, underscores, and hyphens, for example `after_sales.acceptance`.

### 3. Read the status, then correlate by event ID

#### Published statuses

| Status | Meaning | Next step |
|---|---|---|
| `PENDING` | The internal event is in Outbox and waiting for dispatch | Wait briefly and refresh; dispatch runs every five seconds by default |
| `PUBLISHED` | The dispatch transaction completed | Switch to Received and correlate the event type and event ID |

`PUBLISHED` **does not mean that a trigger matched or that a run started**. It only confirms completion of the Outbox dispatch stage.

#### Received statuses

| Status | Main source | Meaning |
|---|---|---|
| `RECEIVED` | Internal event | Inserted into Inbox and being matched or processed |
| `STARTED` | Internal event or Webhook | A trigger matched and a workflow run was created |
| `PROCESSED` | Approval callback | The callback was processed and linked to the existing waiting run |
| `UNMATCHED` | Internal event | No enabled trigger with the same event type existed at arrival |
| `MATCHED` | Internal event | A previously unmatched placeholder was rematched successfully |
| `REJECTED` | Internal event | A trigger matched, but the payload failed that trigger's Schema |

By default, unmatched internal events are retried every 30 seconds. After correcting and enabling the trigger, the original event does not need to be republished; wait for rematching and refresh.

One internal event may match multiple triggers. In that case, Received contains multiple rows with the same event ID, one for each trigger and run. A previous `UNMATCHED` placeholder also changes to `MATCHED` after rematching.

### 4. Continue with the run

When a Received row has a **run ID**, open **Run Instances** to inspect its pinned workflow version, node trace, and final state. Use **Execution Logs** with the run ID for attempt-level retries and error categories.

Approval callbacks do not create a new run. The run ID on a `PROCESSED` row points to the existing run that was waiting for approval.

## Key Fields

| Field | Description |
|---|---|
| Event ID | Idempotency identifier for one request or internal publication; use it to correlate related rows |
| Event type | Business event name used for trigger matching |
| Source | Filterable on Received only; Internal event, Webhook, or Approval callback |
| Trigger / run | Meaningful on Received only; the matched trigger and related run |
| Payload hash | SHA-256 digest of the payload, not the raw body |
| Error summary | Displayable reason for internal-event Schema rejection or startup failure |
| Occurred at | Occurrence time declared by the event source |
| Received at | Time the Received row entered Inbox |
| Processed at | Time Inbox completed matching, startup, or callback processing |
| Published at | Time Outbox completed dispatch |

## FAQ

### Published is PUBLISHED, but why is there no run?

Switch to Received, choose Internal event, and filter by event type. `UNMATCHED` means you should verify that the trigger is enabled, its event type matches, and its workflow is published. For `REJECTED`, correct the trigger payload Schema using the error summary.

### A webhook or approval request failed, but there is no row. Why?

This can be expected. Webhook and approval endpoints validate the public key, timestamp, signature, JSON body, and Schema before inserting an Inbox row. A failure at that stage normally creates no Event Record. Inspect the caller's HTTP response first, then verify the endpoint, secret, signing source text, server clock, and body. Use server logs when necessary.

### Why did an approval record not create a new run?

An Approval Provider only resumes an existing approval wait; it does not start a workflow. A successful callback is `PROCESSED`, and its run ID points to the waiting run.

### Why is a scheduled execution absent?

Cron creates a run directly through the scheduler and does not use the event pipeline. Check **Run Instances** and **Execution Logs**.

## Boundaries

- The page shows payload hashes, not complete sensitive payloads.
- Inbox and Outbox data are tenant-scoped.
- Event Records supports diagnosis but does not replace external-system audit logs, caller responses, or server logs.
