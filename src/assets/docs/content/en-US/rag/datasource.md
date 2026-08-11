## Overview

**Datasource Management** maintains read-only connections to tenant business databases for controlled NL2SQL queries. A datasource defines only "how to connect"; the queryable scope is configured per **Schema permissions** underneath, providing fine-grained control by domain, field and visibility scope.

## Roles & Prerequisites

- **Roles**: Agent Admin (`rag:datasource:list`).
- **Prerequisites**: A read-only database account; target tables exposed as read-only or masked views (recommended).

## How to Access

Main menu: **Agent Management → Datasource Management**.

## Steps

### 1. Create a Datasource

1. Click **Create**, fill in name, code, type, JDBC URL, username and password.
2. Set max connections, query timeout and status, then click **Save**. A password is required when creating a datasource and is never displayed again after saving.
3. Back in the datasource list, click **Test Connection** in that row. If it fails, edit the URL, account or network settings, save, and test again.

> **Note** The code **cannot be changed** after saving; use a meaningful unique code (e.g. `sales_db`) referenced by Skills and logs.

> **Database drivers** The UI and backend validate JDBC URL formats for MySQL, PostgreSQL, Oracle, and SQL Server, but the standard distribution bundles only the MySQL driver. Before using another database, the deployment owner must add its JDBC driver and verify connectivity, dialect handling, and row-limit syntax. A successful save alone does not prove the connection can run.

### 2. Configure Schema Permissions

1. Click **Schema Permissions** on the row to open the schema list of this datasource.
2. Click **Add Schema**, fill in domain code, domain name and view name. Add column metadata and query examples through their structured forms; do not write JSON by hand.
   - **Column metadata**: add one row for each allowed column and fill in name, data type and business description.
   - **Query examples**: add one row for each verified natural-language question and read-only SQL pair.
   - **Sensitive columns**: select columns from the metadata dropdown. Renaming a column updates the selection; deleting or clearing a column removes it from the selection.
3. Set the **visibility scope** (public / department / post / user) and select authorized objects.
4. Save the Schema, then click **Test Schema** from its row. Enter a realistic business question. The system calls the LLM to generate SQL and executes a real read-only query using the current signed-in user's Schema permissions; the page previews up to **20 rows**.
5. Review the generated SQL, row count and fields. Cover normal lookup, time range, enum filters and aggregation. Testing is rejected if the current account is outside the Schema's visibility scope.

### 3. Maintain

- **Enable/Disable**: disabled datasources block NL2SQL/Skill steps using them;
- **Edit**: leaving the password empty keeps it unchanged;
- **Delete datasource**: deletion is blocked while an **enabled** Skill references it. After disabling or updating those Skills, deletion also removes all child Schema configurations;
- **Delete Schema**: a Schema is deleted directly without a Skill dependency check. NL2SQL steps can then use only the remaining visible Schemas; if none remain, the query is blocked.

## Configuration Reference

### Datasource Fields

| Field | Required | Default | Description |
|---|---|---|---|
| Name | Yes | - | Display name |
| Code | Yes | - | Unique per tenant; immutable after save |
| Type | Yes | mysql | mysql / postgresql / oracle / sqlserver; the standard distribution bundles only the MySQL driver |
| JDBC URL | Yes | - | Host, port, database; charset/timezone parameters recommended |
| Username/password | Yes | - | Read-only database account |
| Max connections | No | 10 | 1–100; 5–10 recommended |
| Query timeout | No | 30 | 5–300 seconds |
| Status | No | Enabled | Disabled blocks related queries |

### Schema Fields

| Field | Required | Description |
|---|---|---|
| Domain code / name | Yes | Unique per datasource; business-readable name |
| View name | Yes | Real read-only table or masked view |
| Column metadata | Strongly recommended | Add rows with name, data type and business description. The page serializes them as a JSON array. A non-empty list enables the field whitelist and blocks SELECT *. An empty list does not restrict queryable columns and must not be used in production |
| Examples | No | Add rows with a natural-language question and verified read-only SQL. The page serializes them as the `fewShotExamples` JSON array |
| Allowed functions | No | `allowedFunctions` array. The UI provides common values and accepts custom ones. A non-empty list limits business functions while built-in safe date/null functions remain allowed; empty adds no function restriction |
| Sensitive columns | No | Select physical columns from the metadata rows. This is an extra guard; it is automatically pruned when metadata names no longer exist |
| Visibility | Yes | public / department / post / user (filtered by user organization at runtime) |
| Authorized objects | Per scope | Multi-select departments/posts/users |
| Status | No | Enabled / disabled |

### Filling Complex Schema Fields

#### Column Metadata `columnsMeta`

The page uses a structured table instead of a JSON editor. Add a row for each real database column that queries may use, then fill in:

| Field | Required | Purpose |
|---|---|---|
| `name` | Yes | Physical column name used by the enforced allowlist; not a display label or SQL alias |
| `type` | Yes | Actual database type and precision, helping the model compare, aggregate, and format values; not currently used for JDBC type validation |
| `description` | Yes | Business meaning including units, enum values, time semantics, aggregation rules, and relationships |

The following is the JSON representation sent to the backend after saving; it is not required as page input:

```json
[
  {
    "name": "order_no",
    "type": "VARCHAR(32)",
    "description": "Business order number that uniquely identifies an order"
  },
  {
    "name": "status",
    "type": "VARCHAR(20)",
    "description": "Order status: paid, shipped, or completed"
  },
  {
    "name": "paid_amount",
    "type": "DECIMAL(12,2)",
    "description": "Paid amount in yuan; may be summed or averaged"
  },
  {
    "name": "paid_at",
    "type": "DATETIME",
    "description": "Payment time in Asia/Shanghai, used for daily or monthly statistics"
  },
  {
    "name": "customer_name_masked",
    "type": "VARCHAR(64)",
    "description": "Masked customer name for display only"
  }
]
```

A non-empty array enables the column allowlist and rejects `SELECT *`. Only `name` decides whether a column is allowed; `type` and `description` guide the model. An empty array does not restrict columns and should not be used in production.

#### Query Examples `fewShotExamples`

Use the structured query example table. Add one row for each pair:

- `question`: a realistic natural-language business question;
- `sql`: one manually verified read-only `SELECT` using only this Schema view, columns, and allowed functions.

The following is the serialized backend representation; it is not required as page input:

```json
[
  {
    "question": "Find paid orders with a paid amount greater than 1000 yuan",
    "sql": "SELECT order_no, paid_amount FROM v_after_sales_order WHERE status = 'paid' AND paid_amount > 1000 ORDER BY paid_amount DESC LIMIT 20"
  },
  {
    "question": "Count orders by order status",
    "sql": "SELECT status, COUNT(*) AS order_count FROM v_after_sales_order GROUP BY status ORDER BY order_count DESC"
  }
]
```

Examples must not contain writes, DDL, multiple statements, named parameters, hidden columns, or another table. Avoid one specific user, order, or soon-stale absolute date. Use a few examples to explain error-prone enums, time semantics, and metric definitions.

#### Allowed Functions `allowedFunctions`

The UI stores selected or custom function names as a string array:

```json
["COUNT", "SUM", "AVG", "ROUND"]
```

Use functions supported by the target database. Do not mix MySQL `DATE_FORMAT` with PostgreSQL `DATE_TRUNC`. An empty array means no additional function allowlist, not deny all functions. Strict environments should retain only functions required by the domain.

#### Sensitive Columns `sensitiveColumns`

Select physical columns from the metadata dropdown. The available options always come from the current metadata names. When a metadata row is renamed, its sensitive selection follows the new name; when a row is removed or its name is cleared, the selection is removed.

The following is the serialized backend representation; it is not required as page input:

```json
["customer_phone", "id_card_number", "bank_card_no"]
```

Use physical column names, not display labels, JSON paths, or masked aliases. SQL containing these identifiers is blocked, but this setting does not replace masked views and least-privilege database accounts. Remove highly sensitive fields from the view.

The page generates valid JSON for these fields when saving. Metadata rows require name, data type and description; duplicate names are rejected. Query example rows require both a question and SQL. SQL examples must be manually verified read-only queries using only the Schema scope.

## Example

```json
{
  "domainCode": "sales",
  "domainName": "Sales Data",
  "viewName": "v_sales_order",
  "columnsMeta": [
    { "name": "order_id", "type": "bigint", "description": "Order ID" },
    { "name": "region", "type": "varchar", "description": "Sales region" },
    { "name": "amount", "type": "decimal", "description": "Order amount" }
  ],
  "fewShotExamples": [
    { "question": "Total order amount in East China this month", "sql": "SELECT SUM(amount) FROM v_sales_order WHERE region='East China' AND order_date >= '2026-08-01'" }
  ],
  "allowedFunctions": ["COUNT", "SUM", "AVG", "ROUND"],
  "sensitiveColumns": ["customer_phone"],
  "visibility": "department",
  "allowedDepartmentIds": [1]
}
```

> **Note** NL2SQL allows only read-only, single-statement queries and enforces Schema scope, a 1,000-row maximum, and timeout limits. Once a request enters the NL2SQL executor, successful, blocked, and failed attempts are audited, including unavailable datasources, no visible Schema, and SQL-generation failures. The Schema test page previews only the first 20 returned rows.

> **Testing note** Test Schema is not a SQL-only preview. It executes a real SELECT against the target database and writes a SQL audit record. Use a read-only account and non-sensitive test questions.

## FAQ

**Test connection works but Test Schema fails?**
Check the view name, the read-only account's query permission, and that column metadata matches the view fields.

**Why does generated SQL include fields I didn't authorize?**
First verify that column metadata is not an empty array. Only non-empty metadata enables the column whitelist and blocks SELECT *. Also list absolutely forbidden columns under Sensitive Columns and, preferably, remove them from the database view.

**Does disabling a datasource remove history?**
No. It only blocks new queries; SQL logs and audits remain.

**Why can I select PostgreSQL, Oracle, or SQL Server but not connect?**
First confirm that the matching JDBC driver was added to the deployment. The type controls both URL validation and SQL dialect behavior, so changing only the type or URL is insufficient. After adding the driver, verify account permissions, row-limit syntax, and common functions for that database.

## Tips & Boundaries

- Prefer **read-only/masked views** on the database side as a second line of defense.
- Visibility filtering applies by user organization at runtime; no RLS predicates are needed in Schema.
- Schema tests run with the current signed-in user's ACL. Before testing a restricted scope, include that account in the authorized department, post or user list.
- Datasource deletion is irreversible. Only references from **enabled Skills** block deletion. Disabling a Skill does not rewrite its definition, so bind it to a valid datasource before enabling it again.
- Individual Schema deletion has no dependency guard or restore action. Record the configuration and assess impact before deleting it.
