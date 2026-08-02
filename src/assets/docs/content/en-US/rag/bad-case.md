## Overview

**Bad Case Analysis** manages negative feedback submitted from chat. Administrators can inspect the question, model answer, feedback reason, and retrieval results, then supply a correct answer for quality analysis and later export.

## Roles & Prerequisites

- **Role**: An Agent administrator with Bad Case view/label permission.
- **Prerequisite**: A user has submitted feedback on a chat answer.

## How to Access

Main menu: **Agent Management → Bad Case Analysis**.

## Steps

### 1. Filter and Review

- Filter by keyword, status, and date range. The current page exposes **Pending** and **Labeled** filters.
- The list shows the user question, feedback type, additional details, status, and creation time.
- Click **Details** to inspect session ID, message ID, the full question, AI answer, retrieval results, and any existing correct answer.

### 2. Label a Case

1. Click **Label** for a `pending` case.
2. Check the original question, AI answer, feedback type, details, and retrieval results.
3. Enter the required **Correct Answer** and save. The status becomes `labeled`.

The correct answer is for quality governance and later export. It does not replace live model answers or write to the knowledge base automatically.

## Feedback Types

| Type | Meaning |
|---|---|
| Factual mismatch | Answer conflicts with facts or knowledge-base content |
| Instruction not followed | Requested format or scope was not followed |
| Format issue | Output format was unexpected |
| Content error | The answer contains incorrect content |
| Incomplete answer | Key facts or steps are missing |
| Irrelevant answer | The answer is off-topic |
| Other | Other issues |

## Statuses

| Stored status | Page label | Description |
|---|---|---|
| `pending` | Pending | Waiting for an administrator to provide the correct answer |
| `labeled` | Labeled | Correct answer supplied; waiting for quality governance or export |
| `exported` | Exported | Reserved for a downstream export process; the current page has no action that advances to it |

There is no `processed` status in the current implementation, and labeling does not automatically move a record to `exported`.

## FAQ

**Why is the list empty?**
Bad Cases are created from chat feedback. Confirm that the user submitted feedback and that the tenant and filters are correct.

**Does labeling fix the answer immediately?**
No. It feeds quality analysis and later export. To fix live answers, update the knowledge base, retrieval settings, Skill, or model prompt.

**Why review retrieval results?**
They help separate missing knowledge, retrieval misses, ACL filtering, and model understanding or generation errors.

**Can I delete a Bad Case?**
There is no delete action in the current page. Keep records for audit and quality tracking.

## Boundaries

- Records are tenant-scoped. Questions, answers, and retrieval content may contain sensitive business data, so assign label permission narrowly.
- When many cases share a feedback type, investigate common knowledge, ACL, or prompt defects instead of editing only one correct answer.
