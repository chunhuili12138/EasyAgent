## Overview

**Message Notifications** shows system messages, document parse/process results, and other business reminders for the signed-in user. Messages are scoped to the current user and tenant.

## Entry and Scope

- Main menu: **Messages**.
- A concrete tenant must be selected after login. A system administrator may also view personal global messages while no tenant is selected.
- The page never exposes messages belonging to another user or tenant.

## Search

1. Enter a keyword in the title field. The keyword matches the message title only.
2. Filter by type: info, warning, success, error, document parse, or document process.
3. Filter by **Read** or **Unread**, then click **Search**. Click **Reset** to clear filters.
4. The table shows title, content, type, read status, and creation time.

## Reading Messages

- Click **Mark as Read** on one row to update that message.
- Click **Mark All as Read** and confirm to update every unread message in the current scope.
- Read messages cannot be marked again. The page currently has no delete, edit, or compose action.

## Message Types

| Type | Use |
|---|---|
| Info | General system notice |
| Warning | Notice requiring attention |
| Success | Completed operation or successful result |
| Error | Failed operation or exception |
| Document Parse | File parsing result |
| Document Process | Chunking, embedding, or indexing result |

## FAQ

**Why is a new message missing?**

Confirm the selected tenant, then search again or refresh the page. Messages are ordered newest first.

**Can I restore a message to unread?**

There is currently no restore action. Confirm before using **Mark All as Read**.

**Why can I see only my own messages?**

The server enforces user and tenant isolation. This page does not provide a way for administrators to read another user's personal notifications.
