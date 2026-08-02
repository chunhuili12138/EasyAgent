## Overview

**SQL Audit** records the generation and execution of every NL2SQL query: user question, generated SQL, final executed SQL, status and duration. Queries blocked by security policies also record the blocking reason for troubleshooting and auditing.

## Roles & Prerequisites

- **Roles**: Agent Admin (`rag:sql-log:list`).
- **Prerequisites**: Datasources/Schemas configured and SQL queries produced in sessions.

## How to Access

Main menu: **Agent Management → SQL Audit**.

## Steps

### 1. Browse Records

- Top cards show **total / success / blocked** counts;
- The list shows the natural-language query, generated SQL, status, duration and result row count.

### 2. View SQL Details

Click **Details** to see:

- **Generated SQL**: the model's original SQL (copyable);
- **Final SQL**: the actually executed SQL (copyable; falls back to generated SQL if absent);
- **Block reason**: the specific security reason (red, only when blocked).

### 3. Troubleshoot

- **Blocked**: adjust the question or fix Schema configuration based on the reason;
- **Failed**: check datasource connectivity and view permissions with the error info.

## Configuration Reference

### Status

| Status | Description |
|---|---|
| Success | SQL executed and returned results |
| Blocked | Intercepted by security policies (read-only check, schema scope, function whitelist, sensitive columns, etc.) |
| Failed | Execution error (connection, syntax, timeout, etc.) |

### List Fields

| Field | Description |
|---|---|
| Natural-language query | The user's original question |
| Generated SQL | The model's SQL (monospace) |
| Duration | Execution time in milliseconds |
| Result rows | Rows returned |

## FAQ

**Why was my query blocked?**
NL2SQL enforces read-only, single-statement, schema-scope and other policies; e.g. unauthorized fields, non-whitelisted functions or write attempts are blocked.

**What is the difference between generated and final SQL?**
The final SQL is what actually executed after security checks and rewriting; when different, trust the final SQL.

**How do I reduce SQL failures?**
Keep Schema column metadata consistent with the view, make few-shot examples realistic, and ensure the datasource account works.

## Tips & Boundaries

- All SQL is logged for security audit and quality analysis; logs cannot be deleted.
- Frequent blocks usually mean Schema configuration (field whitelist, allowed functions) needs adjustment.
