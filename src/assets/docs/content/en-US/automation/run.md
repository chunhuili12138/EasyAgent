## Overview

**Run Instances** shows the full trajectory of every workflow execution: run status, duration and errors, plus node-level execution graph, attempt history, loop batches and event timeline. You can inspect details, cancel active runs, retry failed runs and retry failed loop items.

## Roles & Prerequisites

- **Roles**: Agent Admin (`automation:run:list`).
- **Prerequisites**: A workflow has been published and executed (manual or trigger).

## How to Access

Main menu: **Automation Center → Run Instances**.

## Steps

### 1. Browse Runs

- Filter by **workflow and status**; the list shows run ID, workflow, version, trigger type, status, duration and error summary.

### 2. View Run Details

Click **Details** (or double-click the row) to open the drawer with five tabs:

- **Graph**: nodes colored by status (success green / failed red / running yellow / waiting blue); edges show conditions and default branches;
- **Nodes**: type, status, attempt count, error message and timing per node;
- **Attempts**: each attempt number, worker, status and error;
- **Loop batches**: batch progress (success/failed/total), concurrency and rate limit; **retry failed items** when available;
- **Timeline**: the full event sequence with timestamps.

### 3. Cancel a Run

Only **active** states (created, queued, running, waiting event, waiting timer, retry wait) can be cancelled; cancellation is irreversible.

### 4. Retry a Run

Only **FAILED** runs show retry: it creates a new retry run from the **fixed version** of the original run, independent of current drafts.

### 5. Retry Failed Loop Items

When a loop batch has failed items, click **Retry failed items** in the batch details; failed items re-enter scheduling.

## Configuration Reference

### Run Status

| Status | Description | Actions |
|---|---|---|
| Created / Queued | Submitted, waiting to schedule | Cancel |
| Running | Nodes executing | Cancel |
| Waiting event / timer / retry | Suspended | Cancel |
| Pending approval | Waiting for human approval | Approve in session |
| Success | All nodes succeeded | - |
| Partial failure | Some nodes failed but flow completed | - |
| Failed | Execution failed | Retry |
| Cancelled | Manually or by system | - |

### Loop Batch Fields

| Field | Description |
|---|---|
| Batch ID / node | Locates the batch |
| Progress | Success / failed / total items |
| Max concurrency | Items processed at once |
| Rate limit | Items per second |

## FAQ

**Why is a run stuck in "waiting event"?**
The workflow contains wait/approval nodes waiting for an external callback or approver; it continues automatically once handled.

**What's the difference between "partial failure" and "failed"?**
Partial failure: failed nodes were skipped/handled and the flow completed; failed: the flow terminated.

**Does retry use the latest published version?**
No. Retry runs the **fixed version of the original run** for reproducibility.

## Tips & Boundaries

- Cancellation is irreversible: confirm the task is no longer needed.
- For long-waiting runs, check Event Records to confirm whether external callbacks arrived.
- Runtime data (inputs, variables, node outputs) is encrypted; only authorized accounts can view it.
