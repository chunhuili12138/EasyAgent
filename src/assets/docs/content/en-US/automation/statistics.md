## Overview

**Runtime Statistics** presents a cumulative snapshot of the current tenant's automation runs: status, waiting and queueing, completed outcomes, node retries, open dead letters, and execution time. It helps identify an abnormal trend and choose the next diagnostic page. It is not a real-time monitoring dashboard and does not replace Run Instances, Execution Logs, or external-system monitoring.

Metrics are cached per tenant for **five minutes**. Refresh requests the endpoint again but does not bypass an unexpired cache. Check the Statistics snapshot time before deciding whether a new run is included.

## Roles and Prerequisites

- **Role**: Agent Administrator or System Administrator.
- **Prerequisites**: The tenant has automation run data. Flowable runtime, history, and management services must be available to run reconciliation.
- Metrics and reconciliation are tenant-scoped.

## How to Access

Main menu: **Automation Center → Runtime Statistics**.

## Recommended Review Order

### 1. Confirm the snapshot time

Start with the **Statistics snapshot** timestamp above the status distribution. A new run, node retry, or dead letter may not appear until the current five-minute cache expires.

Do not repeatedly use Check and repair to view recent business runs. Query **Run Instances** by time and status instead.

### 2. Evaluate scale and backlog

| Metric | Actual calculation | Diagnostic direction |
|---|---|---|
| Cumulative runs | All retained run records for the current tenant | Overall scale, not daily throughput |
| Currently active | Total minus `SUCCESS`, `PARTIAL_FAILURE`, `FAILED`, and `CANCELLED` | Use status distribution to separate startup, execution, and waits |
| Created and queued | `CREATED` + `QUEUED` | Persistent growth points to engine, concurrency, scheduling, or dependency capacity |
| Currently waiting | `WAITING_EVENT` + `WAITING_TIMER` + `RETRY_WAIT` | Separate event, timer, and automatic-retry waits |

`WAITING_EVENT` can represent an ordinary event wait or an approval wait. Use the run timeline and **Event Records** to identify the expected signal.

### 3. Evaluate completed quality

| Metric | Actual calculation |
|---|---|
| Completed success rate | `SUCCESS ÷ (SUCCESS + PARTIAL_FAILURE + FAILED)` |
| Completed failure rate | `(PARTIAL_FAILURE + FAILED) ÷ (SUCCESS + PARTIAL_FAILURE + FAILED)` |
| Node retry attempts | Count of node attempts where `attemptNo > 1` |
| Open dead letters | Count of Failed Tasks whose status is `OPEN` |

Important details:

- `PARTIAL_FAILURE` counts as failure.
- `CANCELLED` is excluded from both rate denominators.
- When completed runs exist, success and failure rates total 100%.
- Node retry attempts is not the number of workflow-level `RETRY` runs. It counts the second and later attempts of a node execution.
- Handle open dead letters individually in **Failed Tasks**. Reconciliation does not replace safe replay or discard.

### 4. Analyze duration

| Metric | Actual calculation | Interpretation |
|---|---|---|
| Average run duration | Average start-to-completion time for runs with both timestamps | Includes any outcome whose completion time is stored |
| Average queue delay | Average creation-to-start time for started runs | Growth usually indicates scheduling or execution capacity pressure |
| Current average wait | Average time from latest update to now for currently waiting runs | Approximate current wait age, not historical wait-stage duration |
| Average node duration | Average start-to-completion time for completed nodes | Use Execution Logs and dependency telemetry to identify slow nodes |

### 5. Use status distribution to find details

Status Distribution groups all tenant runs and uses cumulative runs as the percentage denominator. After identifying an abnormal state, apply that status in **Run Instances** and inspect the run's nodes, attempts, and timeline.

## Check and Repair

Check and repair is a mutating operational action, not a normal refresh. It scans up to the latest **500 tenant runs with a Flowable process instance ID** and compares the business database with Flowable active instances, history, and engine dead-letter jobs.

### Repairs it can perform

| Detected state | Repair behavior |
|---|---|
| Business run is non-terminal and Flowable has a dead-letter job | Mark the business run `FAILED` with `ENGINE_DEAD_LETTER`; it does not rerun nodes or clear external side effects |
| Business run is terminal but its Flowable instance is still active | Attempt to terminate the residual engine instance |
| No active Flowable instance and history says it was deleted | Mark the business run `CANCELLED` |
| No active Flowable instance and history completed normally | Restore `SUCCESS` or `PARTIAL_FAILURE` from historic variables and restore available output |

After a successful repair, the tenant statistics cache is cleared and the page loads a new snapshot.

### Result fields

| Field | Meaning |
|---|---|
| Inspected | Runs checked in this invocation, up to 500 |
| Repaired | Business runs updated or residual engine instances successfully terminated |
| Business is terminal, but engine termination failed | Run IDs whose residual Flowable instances could not be terminated; inspect server logs |
| No active engine instance and no confirmable historic terminal state | Neither an active instance nor historic completion evidence exists, so the platform does not guess a terminal state |

When the automation engine is enabled, the background job reconciles every tenant with run data every five minutes by default. Manual reconciliation is for a suspected state discrepancy, not routine refresh.

## FAQ

### Why is a newly triggered run missing?

Check the Statistics snapshot time. Metrics are cached for five minutes, and Refresh does not force recomputation. Use **Run Instances** for a current view, then refresh Statistics after the cache expires.

### Does a high waiting count mean the engine is stuck?

Not necessarily. Approval waits, ordinary event waits, timers, and automatic retries all count. Separate `WAITING_EVENT`, `WAITING_TIMER`, and `RETRY_WAIT`, then use Event Records and Execution Logs to verify whether each wait is expected.

### Why does failure rate include partial failure?

Partial failure means that at least part of the business work failed even though the run completed. It therefore counts as failure. Cancellation is not treated as execution failure and is excluded from both rates.

### Can Check and repair retry a failed task?

No. It aligns business run state with Flowable engine/history state. It neither reruns nodes nor compensates or rolls back external APIs. Request safe retry from **Run Instances**, and handle open dead letters in **Failed Tasks**.

## Boundaries

- The snapshot is cumulative and currently has no date-range, workflow, or trigger filter.
- Metrics identify anomalies but do not independently prove an external business action succeeded or failed.
- One reconciliation covers at most the latest 500 runs with engine instance IDs; older runs are outside that scan.
- Reconciliation records run-state repair events but cannot recreate missing external business evidence.
