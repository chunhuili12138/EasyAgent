## Overview

**Execution Logs** records the status, worker thread, error classification, and timing of every workflow-node attempt. Use it to answer:

- Which nodes actually ran, and how many times was each node called?
- Did a failed attempt enter automatic retry, and did a later attempt succeed?
- Was the failure caused by authentication, throttling, timeout, business validation, or another category?

This page is not a general application log. It does not expose raw node inputs, outputs, or full exception stack traces.

## Roles & Prerequisites

- **Role**: tenant Agent Admin.
- **Prerequisite**: at least one workflow has produced a run.

## How to Access

Main menu: **Automation Center → Execution Logs**.

## Recommended Troubleshooting Flow

### 1. Get the run ID from Run Instances

Find the target in **Run Instances** and copy its run ID. Logs are attempt-based, so limiting the query to one run avoids mixing nodes from unrelated executions.

### 2. Filter the target attempts

The filters can be combined:

| Filter | Purpose |
|---|---|
| Run ID | Every node attempt in one workflow run |
| Node run ID | One node and all of its automatic retries in that run |
| Status | Running, succeeded, terminally failed, or waiting for automatic retry |

Click **Search** after entering filters. **Reset** clears the filters and returns to the first page.

### 3. Compare attempts in order

Rows are ordered by start time, newest first. When one node is retried automatically:

- the **node run ID** stays the same;
- the **attempt ID** is different;
- the **attempt number** increases from 1.

Check status and attempt number first, then error category, code, and summary, followed by worker and timing.

### 4. Continue in the related view

- Latest attempt is **SUCCESS**: the node recovered in a later retry.
- Latest attempt is **RETRY_WAIT**: this attempt failed and the process engine is waiting for the next automatic retry.
- Latest attempt is **FAILED**: retries are exhausted or the error is not retryable; open **Failed Tasks** and check for an open dead letter.
- To understand preceding and following nodes, return to **Run Instances** and inspect Nodes and Timeline.

## Field Reference

| Field | Description |
|---|---|
| Attempt | Unique ID of one node call record |
| Run ID | Parent workflow run |
| Node run ID | Aggregate node record within the run; shared by automatic retries |
| Attempts | Attempt sequence, starting at 1 |
| Status | Result or retry-wait state of this attempt |
| Executor | Service thread that handled the attempt, primarily for technical diagnosis |
| Error category | Standard classification assigned by the platform |
| Error code | More specific machine-readable failure identifier |
| Error summary | Concise diagnostic reason, not a full exception stack trace |
| Started / Completed | Timing of this attempt, not the whole workflow |

### Attempt statuses

| Status | Meaning | Next step |
|---|---|---|
| RUNNING | The attempt is executing | Refresh later; investigate service health if it remains unchanged unusually long |
| SUCCESS | The attempt succeeded | No action required |
| RETRY_WAIT | The attempt failed but is retryable; the engine is waiting to schedule another attempt | Refresh and check for a higher attempt number |
| FAILED | Terminal attempt failure | Inspect the error category and check Failed Tasks |

### Error categories

| Category | Typical meaning |
|---|---|
| VALIDATION | Input, mapping, or output violates a configured contract |
| AUTH | Invalid credentials, insufficient permission, or authentication failure |
| RATE_LIMIT | External service throttling |
| TIMEOUT | Node or external call timeout |
| TRANSIENT | Temporary network or service failure, commonly retryable |
| BUSINESS | External system rejects the requested business operation |
| POLICY | Platform security or execution policy rejects the operation |
| CANCELLED | Operation was cancelled |
| UNKNOWN | No more specific category is available |

## Complete Example

An API node times out once and then succeeds:

| Attempt | Status | Error category | Error code | Interpretation |
|---|---|---|---|---|
| 1 | RETRY_WAIT | TIMEOUT | API_TIMEOUT | The first call ended and entered automatic retry wait |
| 2 | SUCCESS | - | - | The later call succeeded |

Both rows have the same node run ID and different attempt IDs. If the final row is still FAILED, continue in **Failed Tasks**; do not treat RETRY_WAIT as a terminal failure.

## FAQ

### Why does one node have multiple rows?

Every actual call receives an independent attempt record when the node retries according to its execution policy. These rows are expected audit evidence.

### Why is there no exact next-retry time for RETRY_WAIT?

The page records that this attempt entered retry wait but does not expose the exact Flowable job schedule. The retry interval comes from the node execution policy. Refresh to check whether the next attempt has appeared.

### Why are request parameters and response bodies missing?

The API intentionally excludes raw node input and output so that credentials, personal information, and business data are not exposed in the log list. Correlate Run Instances, the external-system audit trail, and server logs within your authorization boundary.

### Can logs be exported?

The current page supports paginated queries only; it does not provide export. Do not rely on undocumented export or long-term archive operations.

## Boundaries

- Logs are read-only and tenant-scoped. Nodes cannot be edited or rerun from this page.
- **RETRY_WAIT** belongs to automatic node retry. **Safe retry** from Failed Tasks creates a new workflow run; these are different operations.
- The page shows error summaries rather than complete stack traces. Code-level failures still require backend service logs.
