## Overview

**Event Records** shows the Inbox/Outbox lifecycle for internal events, webhooks, and approval callbacks. Use it to determine whether an event was received, matched a trigger, and started a workflow.

Cron triggers create runs directly through the scheduler and do not create an event record for each fire. Look in Run Instances and Execution Logs for scheduled executions.

## Roles & Prerequisites

- **Role**: An Agent administrator with event-record permission.
- **Prerequisites**: An enabled event, webhook, or approval trigger exists, or the platform is publishing internal events.

## How to Access

Main menu: **Automation Center → Event Records**.

## Steps

### 1. Switch Inbox / Outbox

- **Inbox**: Internal events, webhook requests, or approval callbacks received by the platform, plus matching and startup results.
- **Outbox**: Internal events published by the platform and waiting for delivery to matching event triggers.

### 2. Search and Locate

Filter by event type and status. The table shows event ID, event type, source, status, related trigger/run, payload hash, error summary, and timestamps.

### 3. Troubleshoot a Non-trigger

- **UNMATCHED**: No enabled event trigger matched when the event arrived. After fixing the trigger, the background rematcher periodically retries it.
- **REJECTED**: Payload schema, signature, or callback validation failed. Follow the error summary to fix the source or trigger configuration.
- **RECEIVED** without a run ID: The event is in Inbox but has not started a workflow successfully; inspect the error and later status.

## Sources and Statuses

### Source Types

| Source | Description |
|---|---|
| `INTERNAL` | An event published and delivered inside the platform; Outbox rows also display this source |
| `WEBHOOK` | A callback sent by an external system through a webhook |
| `APPROVAL` | A callback sent by an external approval provider |

### Event Status

| Status | Description |
|---|---|
| `PENDING` | Outbox row created and waiting for delivery |
| `PUBLISHED` | Outbox delivery completed |
| `RECEIVED` | Inbox row received and waiting to start or process |
| `STARTED` | A matching trigger created a workflow run |
| `PROCESSED` | Callback or event processing completed |
| `MATCHED` | An unmatched event later found a trigger and was rematched |
| `UNMATCHED` | No enabled trigger matched; waiting for rematching |
| `REJECTED` | Signature or payload-schema validation failed |

### Event type casing

Event types are normalized to lowercase when saved and matched. Use lowercase letters, digits, dots, colons, underscores, or hyphens, for example `after_sales.acceptance`; do not use casing to distinguish event types.

## Key Fields

| Field | Description |
|---|---|
| Payload hash | SHA-256 digest of the payload; the full payload is not shown in the list |
| Trigger / run | Matching trigger ID and workflow run ID |
| Error summary | Schema, signature, duplicate-event, or startup failure reason |
| Occurred/received/processed time | When the source event occurred, the platform received it, and processing completed |

## FAQ

**The event is “unmatched,” but I just created a trigger.**
Confirm that the trigger is enabled and its event type is spelled the same way. Event types are normalized to lowercase, so casing is not significant; allow time for background rematching.

**Why is there no event record for a Cron run?**
Cron uses a separate scheduler path and creates a run directly. Check Run Instances and Execution Logs.

**How do I confirm an external callback arrived?**
Switch to Inbox and filter for the `WEBHOOK` or `APPROVAL` event type. No new row usually means the request did not arrive, signature validation failed, or the trigger is disabled.

## Boundaries

- The list exposes payload and error hashes/summaries rather than full sensitive payloads.
- Inbox and Outbox records are tenant-scoped; only the current tenant’s events are visible.
