## Overview

**Failed Tasks** stores dead letters created after a workflow reaches terminal failure. It supports the human decision about whether that failure still needs action. It is not a normal automatic-retry queue and does not repair the original run.

The page provides two actions:

- **Safe retry** requests a new `RETRY` run using the original pinned version and runtime data;
- **Discard** closes the pending record so that replay is no longer requested from this dead letter.

Always reconcile the failed node, external business result, and side-effect risk before either action.

## Roles & Prerequisites

- **Role**: tenant Agent Admin.
- **Prerequisite**: a workflow is `FAILED` and its terminal node failure produced a dead letter.

## How to Access

Main menu: **Automation Center → Failed Tasks**.

## Recommended Handling Flow

### 1. Locate pending dead letters

Filter status to **OPEN** first, or enter a run ID for an exact query. **Reset** clears filters and returns to the first page.

Failure type is only a standard category. Use the run ID and node run ID in **Execution Logs** for the specific code and summary. Use **Run Instances** to identify completed nodes and the surrounding timeline.

### 2. Reconcile the external business state

Before recovery, confirm:

1. automatic node retries have ended;
2. whether the failed node may already have submitted an external request;
3. whether an order, refund, notification, or other business result already exists;
4. whether another execution could duplicate a write or notification.

The page does not perform this external reconciliation automatically.

### 3. Choose an action

#### Request safe retry

Only `OPEN` dead letters show the Safe retry action. The platform uses the same replay validation as Run Instances:

- the original run must still be `FAILED`;
- the pinned version and Flowable process definition must remain replayable;
- the original input, variables, and trigger payload must still exist and pass decryption and validation;
- every non-control node must be provably free of external side effects.

If validation passes, the platform creates a new `RETRY` run and marks the dead letter `REPLAYED`. A rejected or failed request leaves it `OPEN`.

> `REPLAYED` means the new run was created; it does not mean the new run succeeded. Follow it in Run Instances.

API, Skill, and other nodes that may call external business systems commonly fail the side-effect-free proof. Replay may therefore be rejected even when the external endpoint is idempotent.

#### Discard a dead letter

Discard is appropriate when:

- the business action was handled manually;
- the task expired or no longer needs execution;
- the original run cannot be replayed safely and will be replaced by an explicit new run;
- another execution could duplicate an existing business result.

Discard changes the status to `DISCARDED`. This page does not provide reopening.

## Field Reference

| Field | Description |
|---|---|
| Dead letter ID | Unique identifier of this failed-task record |
| Run ID | Original workflow run that produced it |
| Node run ID | Terminally failed node record, used to correlate Execution Logs |
| Failure type | Standard failure category; hover for the raw category code |
| Status | `OPEN`, `REPLAYED`, or `DISCARDED` |
| Handled by | User who requested replay or discarded the record; user ID is retained when a name cannot be resolved |
| Created at | Dead-letter creation time |
| Handled at | Time of successful replay creation or discard |

## Status Flow

| Status | Meaning | Actions |
|---|---|---|
| OPEN | Awaiting a human decision | Request safe retry or discard |
| REPLAYED | A new `RETRY` run was created | Read-only; follow the new run in Run Instances |
| DISCARDED | Closed with no replay from this dead letter | Read-only |

`REPLAYED` and `DISCARDED` are terminal dead-letter states. They do not change when a later retry run succeeds or fails.

## Failure Types and Guidance

| Type | Typical meaning | Guidance |
|---|---|---|
| VALIDATION | Input, mapping, or output violates the pinned contract | Replay cannot change the data or version; correct it, publish if needed, and start a new run |
| AUTH | Credentials expired, permission is missing, or external authentication failed | Repair access, reconcile side effects, then decide between replay and a new run |
| RATE_LIMIT | External service throttled the call | Wait for the limit window and reconcile the external result; whole-run replay may still be blocked |
| TIMEOUT | Node or external call timed out | Confirm whether the external operation actually completed before avoiding duplicate submission |
| TRANSIENT | Temporary network or service failure | Repair the dependency and assess replay safety; do not retry only because of the category |
| BUSINESS | External system rejected the business action | Correct the business data or flow and normally start an explicit new run |
| POLICY | Platform policy blocked execution | Correct the security or execution policy; do not use replay to bypass it |
| CANCELLED | Operation was cancelled | Identify the cancellation source and business result before deciding on a new run |
| UNKNOWN | No more specific category is available | Diagnose with Execution Logs and server logs before acting |

## Complete Example

A read-only query workflow produces a `TIMEOUT` dead letter because its database connection failed:

1. Confirm in Execution Logs that automatic node retries are exhausted.
2. Confirm the workflow contains only read-only nodes that are provably side-effect-free.
3. Repair the database connection and click **Safe retry**.
4. The platform creates a `RETRY` run and changes the original dead letter to `REPLAYED`.
5. Follow the new run in Run Instances.

If the same workflow includes an API node that creates refunds, the complete workflow may fail replay validation even when the query node caused the failure. The dead letter remains `OPEN`. Reconcile business results, correct the issue, and explicitly start a new run from Workflow Design.

## FAQ

### Safe retry versus retry in Run Instances?

Both use the same safe-replay method. A successful Failed Tasks action additionally marks its dead letter `REPLAYED`; retry from Run Instances does not handle a dead letter. Failed Tasks is not a way around replay restrictions.

### Why is Safe retry visible but rejected?

The button only means the dead letter is `OPEN` and may submit a request. Replay is rejected when the version is unavailable, history is missing, the original run is no longer `FAILED`, or any node's external side effects cannot be ruled out. The dead letter stays `OPEN`.

### Why is there no specific error message in the list?

The dead letter stores only its category and related IDs. Inspect Execution Logs for the error code and summary; complete technical exceptions require server logs.

### Does discard cancel or roll back the original run?

No. The original run has already failed. Discard closes only the dead letter and does not undo completed nodes or roll back or compensate external API operations.

### Why is a handler shown as a user ID?

The page first resolves active users in the current tenant. If a historical handler is disabled or no longer belongs to the tenant, its user ID remains as the audit identity.

## Boundaries

- Queries and actions are tenant-scoped.
- Only `OPEN` dead letters are actionable; backend locking and status conditions protect concurrent handling.
- When input or workflow configuration must change, publish a new version and start a new run instead of relying on replay.
- Discard does not remove execution logs or run evidence.
