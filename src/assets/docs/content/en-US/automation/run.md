## Overview

**Workflow Runs** preserves the execution history for every workflow run: pinned version, trigger, run status, node activity, attempts, loop batches, and event timeline. Use it to determine the current state, what happened at each node, and whether cancellation or retry is safe.

A run is execution evidence, not workflow configuration. Editing a draft never changes an existing run.

## Roles and Prerequisites

- **Role**: A tenant Agent administrator with automation-run view permission.
- **Prerequisite**: Select a concrete tenant and execute a workflow at least once.
- Run data is tenant-scoped. Global mode prompts you to select a tenant first.

## Access

Main menu: **Automation Center -> Workflow Runs**.

## Browse Runs

### Filters

1. Search the workflow selector by **name or code**. It includes current and archived workflows so historical runs remain traceable.
2. Select a run status, or leave it empty for all states.
3. Click **Search**. **Reset** clears filters and returns to page one.

### List Fields

| Field | Meaning |
|---|---|
| Run ID | Unique execution ID used across logs and events |
| Workflow | Workflow name and stable code |
| Version | Pinned published version, such as `v2` |
| Trigger | Manual, Schedule, Webhook, Internal Event, Retry, Subflow, or API |
| Status | Current run state |
| Duration | Start to completion; active runs use the current time |
| Error code/summary | Run-level failure; open Details for node-level evidence |
| Started at | Actual run start, not the trigger's planned time |

Click the eye icon or double-click a row to open Details.

## Run Statuses

| Status | Meaning | Actions |
|---|---|---|
| `CREATED` | Run record exists; engine startup is not complete | Cancel |
| `QUEUED` | Waiting in the scheduler | Cancel |
| `RUNNING` | Nodes are executing | Cancel |
| `WAITING_EVENT` | Waiting for an event, approval callback, or batch loop | Cancel |
| `WAITING_TIMER` | Waiting for a delay timer | Cancel |
| `RETRY_WAIT` | A node is waiting for its next automatic attempt | Cancel |
| `SUCCESS` | Workflow completed successfully | View |
| `PARTIAL_FAILURE` | A failure followed a handled/continue route and the flow ended | View |
| `FAILED` | Workflow terminated with failure | View, request safe retry |
| `CANCELLED` | Cancelled by a user or system | View |

Approval waits appear as `WAITING_EVENT` at run level. There is **no separate pending-approval run status**. Use Graph, Nodes, and Timeline to distinguish approval from an ordinary event wait.

## Inspect Details

The summary shows status, pinned version, trigger, start time, and duration. Retry runs also show their source run and retry sequence.

### Execution Graph

The graph uses the pinned workflow version, not the current draft. Node colors indicate:

| Color | State |
|---|---|
| Green | Success |
| Red | Failed |
| Orange | Running |
| Blue | Waiting for event or timer |
| Gray | Pending, skipped, or another state |

Use the graph controls to zoom, center, and inspect the minimap. The graph is read-only.

### Nodes

The Nodes tab shows:

- node ID and type;
- current state and attempt count;
- error code and summary;
- start and completion time.

This page does not render raw workflow input, variables, or node input/output bodies. This prevents business payloads from being exposed directly in the run UI. Diagnose mapping issues from the read-only workflow DSL, error summaries, and controlled execution evidence.

### Attempts

A node may produce multiple Attempts through its retry policy. The tab shows:

- Attempt number and node-run ID;
- worker identity;
- state, error code, and error summary;
- start and completion time.

`RETRY_WAIT` means the node is still inside automatic retry. Do not simultaneously request a whole-run retry. This page does not expose the exact Flowable job schedule; use the retry interval in the node execution policy and refresh for the next attempt.

### Loop Batches

A batch-loop node creates a batch and loop items.

| Field | Meaning |
|---|---|
| Batch ID / loop node | Identifies the batch |
| Status | Running, ready to resume, or terminal state |
| Processed | Items in success, failed, or skipped terminal states |
| Failed | Failed subset of processed; do not add it to processed again |
| Total | Total items in the frozen batch snapshot |
| Concurrency / rate | Batch policy pinned at publication |

Click the list icon to inspect items and filter them by status. Each item shows key, state, attempts, error, next retry, and completion time.

The current release **does not expose terminal failed-item replay in Workflow Runs**. The original batch has already resumed its workflow wait when it becomes terminal, so replay cannot reliably resume the same process position again. Preserve the evidence, correct the external API, data, or workflow, and start a new workflow run.

### Timeline

Timeline orders key events by creation time, including:

- run start, completion, cancellation, and retry;
- node start, completion, failure, and scheduled retry;
- wait start, external event receipt, and wait completion.

It displays event type, key, and time. Inspect **Event Records** for Webhook, internal-event, or approval receipt and matching details.

## Cancel a Run

Cancel is available only for `CREATED`, `QUEUED`, `RUNNING`, `WAITING_EVENT`, `WAITING_TIMER`, and `RETRY_WAIT`.

1. Click the stop icon.
2. Verify the run ID and confirm.
3. The platform terminates the active Flowable instance and cancels active loop batches.

Cancellation is irreversible and does not compensate or roll back completed external API calls. If a refund-create call succeeded before cancellation, the external refund record remains.

If the workflow completes while cancellation is being submitted, the platform keeps the actual terminal state and asks you to refresh.

## Retry a Failed Run

Only `FAILED` runs display Retry. Confirmation is followed by backend safety checks.

Retry does not continue from the failed node. It:

1. leaves the original failed run unchanged;
2. pins the original workflow version and process definition;
3. reads the original input, variables, and trigger payload;
4. creates a separate run with trigger type `RETRY`;
5. records the source run ID and retry sequence.

Retry is rejected when:

- the source run is not `FAILED`;
- the original version or Flowable definition is no longer replayable;
- original unredacted runtime data is unavailable;
- the workflow contains nodes whose lack of external side effects cannot be proven.

API, Skill, and other business-writing nodes normally cannot be proven side-effect-free. Even if the external endpoint supports idempotency, the platform may reject whole-run replay. Correct the cause and start an explicit new run from Workflow Design instead.

## Recommended Diagnosis

### Failed Run

1. Read the list-level error code and summary.
2. Open Nodes and find the first failed node.
3. Inspect all Attempts, retry-wait states, and the final error.
4. Open **Execution Logs** and filter by run ID.
5. If a dead letter exists, inspect its category and handling state under **Failed Tasks**.

### Long Wait

1. Use Graph to identify a wait event, approval wait, batch loop, or delay.
2. For `WAITING_TIMER`, verify the configured delay.
3. For `WAITING_EVENT`, read the expected event key in Timeline.
4. For Webhook, internal event, or approval, verify receipt and matching in **Event Records**.
5. For a batch loop, inspect items still in `PENDING`, `RUNNING`, or `RETRY_WAIT`.

### Partial Failure

1. Confirm whether the failure followed a configured error route or continue policy.
2. Compare external business results with the intended partial-success behavior.
3. Treat `PARTIAL_FAILURE` as terminal, not as a run that is still continuing.

## Acceptance Example

For an automated refund-request workflow:

1. Workflow name, pinned version, and trigger match the action.
2. Nodes follow NL2SQL, LLM, Transform, and API dependency order.
3. Attempt counts match node retry policy.
4. Loop processed never exceeds total, and failed is a subset of processed.
5. Start, failure/retry, wait, and completion order agrees with third-party records.
6. `SUCCESS` or `PARTIAL_FAILURE` has explainable evidence. A safe retry of `FAILED` creates a new `RETRY` run while preserving the source.

## FAQ

**Why are archived workflows in the selector?**

Runs are historical evidence. Archiving does not delete past runs, so archived workflows remain filterable.

**Why is a run still waiting for an event?**

It may be waiting for an ordinary event, approval callback, or batch-loop completion. Inspect the waiting node, Timeline, and Event Records.

**Why did approval not create a new run?**

Approval providers resume the original `WAITING_EVENT` run. Continue inspecting the same run ID.

**Why is Retry visible but rejected?**

The button means the status can request retry, not that replay is guaranteed. The platform still validates version availability, historical data, and node side effects.

**What is the difference between partial failure and failure?**

`PARTIAL_FAILURE` means the workflow handled a failure and ended. `FAILED` means the workflow terminated with failure, and only it may request whole-run safe replay.

**Why can I not see full input or node output?**

The UI displays diagnostic state, errors, and timing instead of directly rendering business payloads. Use controlled evidence and workflow mappings without copying sensitive bodies into ordinary logs.

## Boundaries

- Runs remain pinned to their creation-time version. Current drafts and later publications do not alter history.
- Cancellation does not roll back successful external operations.
- Automatic retry is allowed only when whole-run replay can be proven safe; external idempotency alone does not guarantee approval.
- Terminal loop failed-item replay does not yet have a reliable workflow-resume loop, so this page is view-only for those failures.
- Do not hide or delete failed, timed-out, cancelled, or partially failed evidence. It is required for acceptance, audit, and incident review.
