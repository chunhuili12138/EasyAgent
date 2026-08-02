## Overview

**Run Statistics** provides a global health view of the tenant's automation: throughput, queue backlog, waiting states, success/failure rates, retries and dead letters — plus **Reconcile** to repair run status differences.

## Roles & Prerequisites

- **Roles**: Agent Admin (`automation:statistics:view`).
- **Prerequisites**: The tenant has produced automation run data.

## How to Access

Main menu: **Automation Center → Run Statistics**.

## Steps

### 1. Review Overview Metrics

Top cards show:

- **Total runs / active instances / queue backlog / waiting instances**: throughput and backlog;
- **Success rate / failure rate**: overall health;
- **Retry attempts / open dead letters**: retries and anomaly accumulation.

> **Note** Queue backlog (>0) and open dead letters (>0) are highlighted as yellow/red alerts — handle them first.

### 2. Analyze Duration Metrics

Review average instance duration, queue delay, wait duration and node duration to locate bottlenecks (long queueing, slow nodes, or too many waiting events).

### 3. Review Status Distribution

The status distribution table groups runs by status with counts and ratios — quickly spotting suspended states like "waiting event / pending approval".

### 4. Run Reconcile

Click **Reconcile Now**: compares recent run instances with the Flowable engine state and repairs determinable differences (e.g. instances terminal in business but still active in the engine). The system reconciles automatically every 5 minutes.

> **Tip** Results show inspected runs, repaired runs, terminal-but-engine-active runs and unresolved runs.

## Configuration Reference

### Metric Cards

| Metric | Description | Watch for |
|---|---|---|
| Total runs | Cumulative runs | - |
| Active instances | Currently executing | High = heavy load |
| Queue backlog | Runs waiting to schedule | >0 yellow alert |
| Waiting instances | Suspended (event/timer/approval) | Check Event Records |
| Success / failure rate | Overall health | Sudden failure spikes |
| Retry attempts | Cumulative auto retries | High = unstable nodes |
| Open dead letters | Unhandled failures | >0 red alert |

### Duration Metrics

| Metric | Description |
|---|---|
| Avg instance duration | Average execution time per run |
| Avg queue delay | Time from submission to start |
| Avg wait duration | Average suspended time |
| Avg node duration | Average execution time per node |

## FAQ

**Queue backlog keeps growing?**
Check concurrency and rate limits, and whether external dependencies (database/API/model) slowed down; split or optimize workflows when needed.

**What can Reconcile fix?**
It repairs run-instance vs engine state inconsistencies (e.g. dangling states after process restarts); unresolvable instances are kept for manual handling.

**Why are new runs missing from statistics?**
Statistics are aggregated per tenant with a generation timestamp; freshly triggered runs may need a refresh cycle.

## Tips & Boundaries

- Include alert metrics (backlog, dead letters) in daily checks to avoid failure accumulation.
- Reconcile is operational and runs automatically; manual invocation is rarely needed.
