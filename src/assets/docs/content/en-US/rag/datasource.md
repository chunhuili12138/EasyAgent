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
2. Click **Test Connection** to verify, then save.

> **Note** The code **cannot be changed** after saving; use a meaningful unique code (e.g. `sales_db`) referenced by Skills and logs.

### 2. Configure Schema Permissions

1. Click **Schema Permissions** on the row to open the schema list of this datasource.
2. Click **Add Schema**, fill in domain code, domain name, view name and column metadata.
3. Set the **visibility scope** (public / department / post / user) and select authorized objects.
4. Click **Test Schema**: enter a business question; the system generates SQL and previews up to **20 rows**; save once the query behaves as expected.

### 3. Maintain

- **Enable/Disable**: disabled datasources block NL2SQL/Skill steps using them;
- **Edit**: leaving the password empty keeps it unchanged;
- **Delete**: also deletes all its Schema configurations.

## Configuration Reference

### Datasource Fields

| Field | Required | Default | Description |
|---|---|---|---|
| Name | Yes | - | Display name |
| Code | Yes | - | Unique per tenant; immutable after save |
| Type | Yes | mysql | mysql / postgresql / oracle / sqlserver |
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
| Column metadata | Yes | JSON array of name/type/description; acts as a field whitelist, forbids SELECT * |
| Examples | No | JSON array of `{"question","sql"}` for few-shot |
| Allowed functions | No | Function whitelist (COUNT, SUM, AVG, ROUND, etc.); empty = no restriction |
| Sensitive columns | No | Extra guard, e.g. `["customer_phone","id_card_number"]` |
| Visibility | Yes | public / department / post / user (filtered by user organization at runtime) |
| Authorized objects | Per scope | Multi-select departments/posts/users |
| Status | No | Enabled / disabled |

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

> **Note** NL2SQL only allows read-only, single-statement queries constrained by schema scope, row limits and timeouts; all generated SQL is audited.

## FAQ

**Test connection works but Test Schema fails?**
Check the view name, the read-only account's query permission, and that column metadata matches the view fields.

**Why does generated SQL include fields I didn't authorize?**
Column metadata is the whitelist: only configured fields are exposed to the model. Keep sensitive fields out of the metadata.

**Does disabling a datasource remove history?**
No. It only blocks new queries; SQL logs and audits remain.

## Tips & Boundaries

- Prefer **read-only/masked views** on the database side as a second line of defense.
- Visibility filtering applies by user organization at runtime; no RLS predicates are needed in Schema.
- Deleting a datasource is irreversible and removes Schema configurations; confirm no Skills reference it.
