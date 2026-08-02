## Overview

**Operation Audit** records human approval (HITL) events during agent execution, covering two high-risk operation types: API calls and SQL execution. It shows who confirmed or cancelled which operation, when, and the tool input and context snapshot at the time — for traceability and compliance.

## Roles & Prerequisites

- **Roles**: Agent Admin (`rag:audit:list`).
- **Prerequisites**: Sessions have produced operations requiring approval (action tools or SQL execution).

## How to Access

Main menu: **Agent Management → Operation Audit**.

## Steps

### 1. Filter Records

- Top cards show **total / confirmed / cancelled** counts;
- Filter by **user, operation type, status and date range**.

### 2. View Details

Click **Details** to see:

- Operation type, tool/code, risk level, status, initiator and time;
- **Tool input**: formatted JSON with **sensitive fields masked** (passwords, tokens, API keys, Authorization → `******`), copyable with one click;
- **Cancel reason**: for cancelled operations;
- **Context snapshot**: the session context at that time, also masked.

## Configuration Reference

### Operation Types

| Type | Description |
|---|---|
| api_call | External API call |
| sql_exec | NL2SQL query execution |

### Status

| Status | Description |
|---|---|
| Pending | Waiting for the approver |
| Confirmed | Approved; task continues |
| Cancelled | Rejected; task terminated |
| Timeout | No action within the time limit |

### Risk Levels

| Level | Meaning |
|---|---|
| Low | Read-only/query operations |
| Medium | General external calls |
| High | Data changes or high impact |

## FAQ

**Are secrets safe in audit records?**
Details display masks sensitive fields automatically; copying copies the masked content. Raw values never appear in the frontend.

**Why do some operations have no audit record?**
Only **action** tools and SQL execution require approval and audit; ordinary query calls are not enforced.

**What happens to timed-out approvals?**
The operation is marked "timeout" and the task follows the platform policy (usually termination or degradation).

## Tips & Boundaries

- Audit records cannot be modified or deleted; they exist for compliance traceability.
- Handle approvals in sessions promptly to avoid timeouts that fail tasks.
