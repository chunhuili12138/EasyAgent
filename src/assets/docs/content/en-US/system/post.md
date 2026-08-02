## Overview

**Post Management** maintains the post system under departments: post codes and names, used for user membership and fine-grained authorization (document security level "specific post", Schema/tool authorization scopes, etc.). Posts must be attached to a department.

## Roles & Prerequisites

- **Roles**: Tenant Admin (`system:post:list`).
- **Prerequisites**: Department data exists.

## How to Access

Main menu: **System Management → Post Management**.

## Steps

### 1. Create a Post

1. Click **Create**, select the owning department (required).
2. Fill in the post name and code (use a clear English/pinyin identifier such as `sales_manager`).
3. Set sort and status, then save.

### 2. Edit a Post

Name, department, sort and status can be edited; migrate references first if the post is used by users or ACLs.

### 3. Delete a Post

Click **Delete** to remove the post; related authorizations become ineffective if users or ACLs still reference it — adjust them first.

## Configuration Reference

| Field | Required | Default | Description |
|---|---|---|---|
| Department | Yes | - | Tree select; posts must belong to a department |
| Name | Yes | - | Display name |
| Code | Yes | - | Referenced by the system; uniqueness is not enforced, so keep it stable and non-duplicated within the tenant |
| Sort | No | 1 | Higher number sorts later (min=1) |
| Status | No | Enabled | Enabled / disabled; disabled posts are not selectable for user assignment |

## FAQ

**Why is the post dropdown empty when assigning users?**
Confirm the selected department has **enabled** posts; the dropdown only shows enabled posts under the selected department.

**Can post codes be changed?**
Yes, but historical references (ACLs, system references) may break; keep codes stable.

**What's the difference between posts and roles?**
Posts are organizational membership (data scope and authorization scope); roles decide menus and operation permissions. They work together.

## Tips & Boundaries

- Keep post codes stable, meaningful and non-duplicated within the tenant to avoid confusing authorization references; the system does not currently enforce code uniqueness.
- Disabling a post removes it from user assignment and authorization selections immediately — assess the impact first.
