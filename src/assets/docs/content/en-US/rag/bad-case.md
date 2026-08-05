## Overview

**Bad Case Analysis** centralizes negative feedback submitted in Intelligent Chat. Each case is tied to one assistant message and stores the round's question, AI answer, feedback type, optional reason, and retrieval result so an Agent administrator can diagnose the cause and enter a reference correct answer.

The current page supports individual review and labeling only. It has no bulk labeling, deletion, rerun, export, or automatic-fix action.

## Roles & Prerequisites

- **Role**: Agent Admin (the backend requires `AGENT_ADMIN` or `SYS_ADMIN`).
- **Creation condition**: a user submits negative feedback on an assistant answer and chooses a valid feedback type. One message creates at most one Bad Case.

## How to Access

Main menu: **Agent Management → Bad Case Analysis**.

## Steps

### 1. Review Statistics and Filter

- The cards show tenant-wide **Pending / Labeled** counts and do not change with list filters.
- Keyword matches the **user question only**, not the AI answer or feedback reason.
- Status offers Pending and Labeled; the date range filters by record creation date.
- Click **Search** to apply conditions. **Reset** clears conditions and returns to page 1.
- Pagination supports 10 / 20 / 50 / 100 rows, ordered by creation time descending.

### 2. View Details and Diagnose the Cause

Click **Details** to inspect:

- session ID, message ID, and current status;
- full user question and AI answer;
- feedback type and optional user reason;
- the retrieval result saved for that round;
- any labeled correct answer.

Use this diagnosis order:

1. Empty retrieval result: check missing knowledge, processing/index state, ACL filtering, or question wording.
2. Relevant evidence but wrong answer: inspect prompts, context truncation, citation gates, and model generation.
3. Factually correct but format/instruction feedback: adjust the Skill LLM prompt, output Schema, or answer rendering.
4. Tool or data-query issue: correlate the case with Operation Audit or SQL Audit.

### 3. Label a Correct Answer

1. Click **Label** on a `pending` case. Labeled records no longer show this action in the page.
2. Review the question, original answer, feedback type, and reason.
3. Enter a non-empty **Correct answer** that answers the original question and states required evidence and boundaries.
4. Click **Save**. The system trims surrounding whitespace, records the labeler and time, and changes status to `labeled`.

Labeling does not alter the original chat message, add content to the knowledge base or Experience Pool, update a Skill, or rerun the answer. Fix the owning content or configuration and retest the real conversation.

## Feedback Types

| UI label | Stored value | Use when |
|---|---|---|
| Factual mismatch | `factual_mismatch` | The answer conflicts with trusted material or business facts |
| Instruction not followed | `instruction_not_followed` | Requested scope, format, or steps were ignored |
| Format issue | `format_issue` | Table, fields, paragraphs, or readability are unsuitable |
| Content error | `content_error` | Reasoning, calculation, or operational guidance is wrong |
| Incomplete answer | `incomplete_answer` | Key facts, conditions, or next actions are missing |
| Irrelevant answer | `irrelevant_answer` | The response does not address the question |
| Other | `other` | The issue does not fit the above types |

## Statuses

| Stored status | UI meaning | Current page capability |
|---|---|---|
| `pending` | Pending | View and enter a correct answer |
| `labeled` | Labeled | View only; no edit action is shown |
| `exported` | Exported (reserved) | The backend retains this status in statistics, but the page has no filter, export, or transition action |

## FAQ

**Why is there no case after negative feedback?**
Confirm that feedback submission succeeded and a valid type was selected. Only negative feedback on assistant messages creates a case; neutral/positive feedback does not, and repeated submission for the same message does not create duplicates.

**Why did keyword search miss text from the feedback reason?**
Keyword searches user questions only. Combine date and status filters, then inspect the reason shown in the list.

**Does labeling immediately correct the answer?**
No. It records a quality-governance reference and does not rewrite runtime configuration.

**Can I delete, export, or reopen a labeled case?**
Not from the current page. `exported` is a reserved state and does not mean an export workflow is available here.

## Boundaries

- Data is tenant-isolated. Questions, answers, and retrieval results may contain sensitive business data, so grant Agent administration by least privilege.
- A correct answer must be based on verified material rather than speculation.
- For repeated cases, fix the shared cause and rerun a natural user conversation instead of only labeling each record.
- Retrieval results are historical snapshots and do not replace checking the current knowledge base, Schema, tool, and Skill configuration.
