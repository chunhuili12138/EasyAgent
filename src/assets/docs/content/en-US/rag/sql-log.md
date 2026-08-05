## Overview

**SQL Audit** records natural-language requests handled by the NL2SQL executor and their outcomes: generated SQL, controlled final SQL, success/block/failure state, reason, duration, and row count. It is used to review Schema configuration, security policy, and datasource health; it is not an SQL editor or execution console.

Datasource **Test Connection** checks JDBC connectivity only and does not create an SQL Audit record. **Test Schema** performs real NL2SQL execution and therefore does create one.

## Roles & Prerequisites

- **Role**: Agent Admin (the backend requires `AGENT_ADMIN` or `SYS_ADMIN`).
- **Prerequisite**: Intelligent Chat, a Skill, an Automation NL2SQL node, or Test Schema has called the NL2SQL executor.

## How to Access

Main menu: **Agent Management → SQL Audit**.

## Steps

### 1. Review Statistics and Executions

- Cards show tenant-wide **Total / Success / Blocked** counts and do not change with list filters.
- The backend also counts failures, but there is no Failure card; use the Status filter.
- The list shows natural-language query, generated SQL, status, execution duration, row count, and creation time.
- Generated SQL is truncated to 200 characters in the list; open Details for the complete value.
- Records are ordered by creation time descending with 10 / 20 / 50 / 100-row pagination.

### 2. Filter Records

1. Keyword matches the **natural-language query only**, not SQL or reason text.
2. Status offers Success, Blocked, and Failed.
3. The date range filters by record creation date and includes the selected end date.
4. Click **Search**; changing status or date also reloads immediately.
5. **Reset** clears all conditions and returns to page 1.

### 3. View and Copy Details

Click **Details** to inspect:

- **Natural-language query**: final question/hint sent to NL2SQL. In a Skill this can be `query_hint`, not the exact chat wording.
- **Generated SQL**: LLM output after removing code fences and a trailing semicolon.
- **Final SQL**: SQL after the platform adds its maximum-row limit. It can be empty for an earlier failure and the page then falls back to generated SQL.
- **Status** and **block/failure reason**.

Generated and final SQL can be copied. Copying is for investigation only and cannot execute SQL here. If reproducing in a database client, use a read-only account and inspect literals for sensitive values.

### 4. Troubleshoot by Status

| Status | Check first |
|---|---|
| Success `success` | Returned fields, row count, and business meaning; success does not guarantee semantic correctness |
| Blocked `blocked` | No visible Schema, non-SELECT/dangerous SQL, unauthorized table/column, wildcard, unauthorized function, or sensitive column |
| Failed `failed` | Missing/disabled datasource, SQL generation, missing concrete parameter, SQL syntax, connection, account permission, or timeout |

Recommended flow:

1. Read the detail reason and final SQL.
2. In **Datasource Management → Schema Permissions**, verify view, column metadata, functions, sensitive columns, visibility, and status.
3. For connectivity/permission failures, run **Test Connection**, then **Test Schema** as the same visible user.
4. Rerun a natural business question and confirm a new successful audit record. Existing records are not overwritten.

## Record Creation Stages

Once a request enters NL2SQL, these major outcomes are audited:

| Stage | Typical status | SQL fields |
|---|---|---|
| Datasource missing or disabled | failed | Generated/final SQL empty |
| No Schema visible to the user | blocked | Generated/final SQL empty |
| LLM cannot generate SQL | failed | Generated/final SQL empty |
| Generated SQL has an unbound named parameter | failed | Generated SQL present, final SQL empty |
| Security or Schema-scope rejection | blocked | Generated SQL and row-limited final SQL present |
| Database execution exception | failed | Generated and final SQL present |
| Database execution succeeds | success | Generated/final SQL, duration, and row count present |

Queries without an explicit limit are capped at 1,000 rows and JDBC `setMaxRows(1000)` is also applied. Test Schema previews only the first 20 rows. SQL Audit never stores the returned row data itself.

## FAQ

**Why does Natural-language query differ from the user's wording?**
A Skill or plan step can provide a fixed `query_hint`. The audit stores the actual executor input so SQL-generation conditions can be reconstructed.

**Why can successful SQL still have the wrong business meaning?**
Security validation proves that SQL is safe to execute, not that model interpretation is correct. Improve domain description, field meaning, enums, and few-shot examples, then retest representative questions.

**Why is SQL incomplete in the list?**
The list returns only the first 200 characters for readability. Details returns the complete SQL.

**Can records be changed or deleted?**
The page has no edit, delete, rerun, or export action. Records are retained for tenant traceability.

## Tips & Boundaries

- SQL Audit differs from Operation Audit: this page records NL2SQL outcomes; Operation Audit records HITL decisions.
- Records are tenant-isolated, but SQL can contain business conditions or literal values. Restrict Agent administration accordingly.
- Result rows are not stored here. Reproduce data through controlled Test Schema or the real business conversation.
- An audit-write exception is logged as a server warning but does not reverse the query result. Compliance deployments should also monitor SQL-audit write-failure logs and metrics.
