## Overview

**Failure Tasks** centrally manages **dead letters** from failed workflow executions: review failure types and reasons, **safely retry** recoverable failures, or **discard** dead letters confirmed as unnecessary — preventing failure backlog.

## Roles & Prerequisites

- **Roles**: Agent Admin (`automation:failure:list`).
- **Prerequisites**: Workflow executions failed and entered the dead-letter channel.

## How to Access

Main menu: **Automation Center → Failure Tasks**.

## Steps

### 1. Browse Dead Letters

- Filter by **run ID and status**;
- The list shows dead letter ID, run ID, node run ID, failure type (tooltip shows the raw reason code), status, handler and timestamps.

### 2. Safe Retry

Only **OPEN** dead letters have actions: click **Safe Retry**; the system reruns the **fixed version** of the original run and creates a new retry run.

> **Tip** Safe retry does not modify the original run definition and is reproducible — the preferred way to recover failed tasks.

### 3. Discard a Dead Letter

When recovery is not needed, click **Discard** and confirm: the dead letter closes and will not be retried.

### 4. Status Flow

**Open → Replayed / Discarded**: after replay or discard the dead letter closes and leaves the backlog.

## Configuration Reference

### Failure Types

| Type | Meaning | Suggestion |
|---|---|---|
| VALIDATION | Data validation failed | Fix input data, then retry |
| AUTH | Authentication/authorization failure | Check credentials and permissions |
| RATE_LIMIT | Rate limited | Retry after the window |
| TIMEOUT | Execution timeout | Increase timeout or split the task |
| TRANSIENT | Temporary connection issue | Direct retry usually recovers |
| BUSINESS | Business processing failure | Handle per business logic |
| POLICY | Intercepted by policy | Check security policies |
| CANCELLED | Task cancelled | No action needed |
| UNKNOWN | Unknown failure | Contact the admin |

### Status

| Status | Description |
|---|---|
| Open | Dead letter open; retry or discard |
| Replayed | Safe retry executed |
| Discarded | Confirmed not to retry |

## FAQ

**Safe retry vs. the "retry" on Run Instances?**
Both run the fixed version; Failure Tasks targets dead letters with failure-type analysis, Run Instances targets failed runs.

**What if the retry fails again?**
Fix the root cause (credentials, data, external system) per the failure type, then retry; consider redesigning the workflow after repeated failures.

**Why do some dead letters have no actions?**
Only **OPEN** dead letters are actionable; replayed/discarded records are read-only.

## Tips & Boundaries

- Dead letters are the last line for run failures; handle them regularly to avoid backlog.
- Discarding is irreversible; confirm the task truly does not need to run.
