## Overview

**Execution Logs** records every node execution attempt: node runs, retries and error summaries. It is the first place to look when troubleshooting failures — locate by run ID and inspect the status, worker and error of each attempt.

## Roles & Prerequisites

- **Roles**: Agent Admin (`automation:log:list`).
- **Prerequisites**: Workflow runs exist.

## How to Access

Main menu: **Automation Center → Execution Logs**.

## Steps

### 1. Locate Logs

- Search by **run ID** (numeric);
- Or filter by **status** (running / success / failed / retry wait).

### 2. Analyze Attempts

The list is attempt-based: attempt ID, run ID, node run ID, attempt number, status, worker, error code/message and start/end times.

> **Tip** A failed node retries per policy, producing multiple attempt records; `attemptNo` identifies which attempt.

### 3. Cross-Reference

- Go from `runId` / `nodeRunId` back to Run Instances for the node graph;
- For severe unrecoverable failures, handle dead letters in Failure Tasks.

## Configuration Reference

### Status

| Status | Description |
|---|---|
| Running | Attempt executing |
| Success | Attempt succeeded |
| Failed | Attempt failed (retry may be scheduled) |
| Retry wait | Retry scheduled, waiting |

### Key Fields

| Field | Description |
|---|---|
| Attempt ID / number | Identifier and sequence of the attempt |
| Node run ID | Related node run |
| Worker | The worker executing the node |
| Error code / message | Failure reason |

## FAQ

**Why does one node have multiple log lines?**
The node failed and auto-retried per its configuration (timeout, transient errors); each attempt gets a line.

**How long are logs kept?**
Logs are kept with runtime data per platform policy; export and archive long histories.

**Error messages are not enough?**
Combine the node/timeline tabs in Run Instances and dead letters in Failure Tasks for a full picture.

## Tips & Boundaries

- Filter by run ID first to avoid noise.
- Logs are read-only and used for audit and failure analysis.
