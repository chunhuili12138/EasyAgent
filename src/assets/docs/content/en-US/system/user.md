## Overview

**User Management** maintains the tenant's accounts: creating users (phone number is the login account), assigning roles and organization (department + post), enabling/disabling accounts and resetting passwords. **Roles** decide permissions; **department/post** decide data scope.

## Roles & Prerequisites

- **Roles**: Tenant Admin (`system:user:list`).
- **Prerequisites**: Departments, posts and roles exist.

## How to Access

Main menu: **System Management → User Management**.

## Steps

### 1. Create a User

1. Click **Create**, fill in phone number (login account), nickname, email and initial password.
2. Assign **roles** (at least one; decides menu permissions).
3. Assign **department and post** (as a pair; posts filter by the selected department).
4. Confirm the user's **tenant**: only a system admin can bind multiple tenants; a tenant admin can bind users only to the current tenant.
5. Save; the user can log in with the phone number and password.

### 2. Edit a User

- Nickname, email, status, roles and organization can be edited;
- **The phone number (account) cannot be changed**.

### 3. Reset Password

Click **Reset Password** to set a new password (no old password required); notify the user to change it promptly.

### 4. Disable / Delete

- **Disable**: the user cannot log in; data is kept;
- **Delete**: removes the account from the tenant (prefer disable if business data exists).

## Configuration Reference

| Field | Required | Description |
|---|---|---|
| Phone number | Yes | The login account; immutable after creation |
| Nickname | No | Display name |
| Email | No | Notifications and recovery |
| Initial password | Yes (create) | 6–18 characters, including a letter, a digit and a special character; no whitespace |
| Status | No | Enabled / disabled (default enabled) |
| Tenant | Yes | Multi-select for system admins only; tenant admins are fixed to the current tenant |
| Roles | Yes | At least one; decides accessible menus |
| Department | Paired with post | Data scope and ACL membership |
| Post | Paired with department | Only enabled posts under the selected department |

> **Note** Department and post must both be empty or both selected, avoiding dangling post assignments.

## FAQ

**Login fails but the password is correct?**
Check that the account is enabled and belongs to the current tenant (select the right tenant on the login page).

**Why can't a user see some menus?**
Menus come from roles: assign a role containing the target menu permissions.

**Can a user belong to multiple departments?**
Currently one department + post per user; combine roles and ACL scopes for broader permissions.

## Tips & Boundaries

- The phone number is the account and cannot be changed — verify before submitting.
- Disabling is reversible; deletion is not — be careful.
- Initial passwords are set by admins; encourage users to change them after first login.
