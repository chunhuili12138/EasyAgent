## Overview

**Operation Audit** traces HITL decisions from Intelligent Chat. Before a high-risk step executes, the system stores a pending approval record and later updates it when the user confirms, cancels, or times out. This page is read-only; it cannot confirm, reject, edit, or delete records.

The current chat executor triggers HITL for `action` API tools. The page also retains a `sql_exec` filter for compatible historical or other execution-chain records. Ordinary NL2SQL queries do not automatically require approval here; inspect them in **SQL Audit**.

## Roles & Prerequisites

- **Role**: Agent Admin (the backend requires `AGENT_ADMIN` or `SYS_ADMIN`).
- **Prerequisite**: Chat has produced an action-API approval request, or compatible approval records already exist.

## How to Access

Main menu: **Agent Management → Operation Audit**.

## Steps

### 1. Review Statistics and Records

- Cards show tenant-wide **Total / Confirmed / Cancelled** counts and do not change with list filters.
- Timeout is counted by the backend but has no separate card; use the Status filter to inspect it.
- The list shows action type, tool code, risk level, status, decision user, and creation time.
- Records are ordered by creation time descending with 10 / 20 / 50 / 100-row pagination.

### 2. Filter Records

Filters can be combined:

| Filter | Description |
|---|---|
| User | Select from current-tenant users; for resolved records this normally identifies who confirmed or cancelled |
| Action type | API call `api_call` or SQL execution `sql_exec` |
| Status | Pending, Confirmed, Cancelled, or Timeout |
| Date range | Approval-record creation date |

Changing a select or date range reloads the list, and **Search** is also available. **Reset** clears all filters and returns to page 1.

### 3. View and Copy Details

Click **Details** to inspect:

- action type, tool code, risk level, and status;
- tool input: the step configuration/parameter snapshot frozen when approval was created;
- cancellation reason: user rejection, interruption, restart, timeout, or another system reason;
- context snapshot: completed-step summary or suspended execution state captured at approval time.

Tool input and context are displayed as formatted JSON and can be copied. Copied content matches the display and passes through frontend field redaction again.

### 4. Correlate Failures

1. Long-running `pending`: return to the original chat and inspect its approval prompt and Redis/HITL state.
2. `cancelled`: use the reason to distinguish user rejection, inactive original execution, restart, or system failure.
3. `timeout`: approval was not resolved within the wait window and the original execution normally cannot reuse that decision.
4. `confirmed` but external operation failed: approval only permitted continuation; inspect chat step output, external logs, and Tool configuration.

## Fields and Statuses

### Action Types

| Stored value | UI meaning | Current source |
|---|---|---|
| `api_call` | API call | HITL for an `action` tool in Intelligent Chat |
| `sql_exec` | SQL execution | Compatible historical/other writers; ordinary NL2SQL is primarily recorded in SQL Audit |

### Statuses

| Status | Meaning |
|---|---|
| `pending` | Waiting for confirmation or cancellation in the original chat |
| `confirmed` | User confirmed and execution may continue; this does not prove the external call succeeded |
| `cancelled` | Rejected by the user or cancelled because of interruption, conflict, or another system condition |
| `timeout` | No decision completed within the approval window |

### Risk Levels

`low`, `medium`, and `high` are display metadata carried by the approval step; the default is `medium` when none is supplied. Risk level helps explain impact but does not replace Tool `query/action` classification or automatically change permission and approval behavior.

## Redaction Rules

Backend and frontend recursively mask JSON fields whose key contains `password`, `secret`, `token`, `api-key`/`api_key`, `authorization`, or `cookie`.

Detection is based on **field names**. A secret stored under an ordinary key, or content that is not valid JSON, is not guaranteed to be masked. Do not store credentials in Tool parameters, templates, or context; use encrypted API Tool authentication instead.

## FAQ

**Why is an SQL query missing from Operation Audit?**
This page stores HITL approvals. Ordinary read-only NL2SQL has no chat approval and belongs in SQL Audit, which records success, block, and failure outcomes.

**Why did the business operation fail after confirmation?**
Confirmation only allows execution to continue. The post-approval call can still fail because of a changed Tool, parameter validation, SSRF policy, authentication, timeout, business status, or response mapping.

**Can I confirm later or edit status on this page?**
No. Decisions must be made through the original chat HITL flow. Audit records are not editable or deletable here.

## Tips & Boundaries

- Records are tenant-isolated, but details may contain business parameters and context. Grant Agent administration by least privilege.
- Do not equate “Confirmed” with “Succeeded.” Correlate chat execution output and external-system logs.
- The page has no session-ID, message-ID, or tool-input keyword filter. Start with user, time, and tool code.
- Redaction is a display safeguard, not secret management. Never pass long-lived credentials as ordinary parameters.
