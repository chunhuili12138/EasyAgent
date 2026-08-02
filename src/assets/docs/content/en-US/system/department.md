## Overview

**Department Management** maintains the tenant's organization tree: department hierarchy, leader, phone and enabled status. Departments are the base organizational unit for document ACLs, datasource/tool authorization scopes and user membership.

## Roles & Prerequisites

- **Roles**: Tenant Admin (`system:department:list`).

## How to Access

Main menu: **System Management → Department Management**.

## Steps

### 1. Create a Department

1. Click **Create** (or **Add child** on an existing row to create a sub-department).
2. Select the parent department (empty = root), fill in name, leader, phone and sort.
3. Save; the department appears in the tree.

### 2. Edit a Department

Click **Edit** to change the leader, phone, sort or status; the name can also be modified.

### 3. Delete a Department

Click **Delete**: deletion is blocked while **child departments** exist (remove/move children first). After deletion, user memberships must be re-assigned.

> **Note** Disabling a department does not affect historical data, but it disappears from new authorization selections.

## Configuration Reference

| Field | Required | Default | Description |
|---|---|---|---|
| Parent department | No | Root | Tree select; empty = top level |
| Name | Yes | - | Unique identifier of the department |
| Leader | No | - | Leader name |
| Phone | No | - | Contact phone |
| Sort | No | 1 | Higher number sorts later (min=1) |
| Status | No | Enabled | Enabled / disabled |

## FAQ

**Why is deletion blocked with "child departments exist"?**
Departments with children cannot be deleted; remove or re-parent the children first, then delete.

**What happens to document ACLs after deleting a department?**
Historical ACL data remains but loses effect; re-configure authorization scopes for affected documents promptly.

**How many hierarchy levels are supported?**
Any depth is supported; 3–4 levels are recommended for manageability.

## Tips & Boundaries

- The department tree is shared across file upload, Schema authorization and tool authorization — keep naming consistent.
- Adjusting the hierarchy affects user ACL membership; do it off-peak.
