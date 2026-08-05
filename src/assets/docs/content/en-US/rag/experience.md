## Overview

The **Experience Pool** automatically stores knowledge answers that pass the quality gate, together with their question, answer, citations, and source chunks. When the **same question** appears later, the system first revalidates tenant scope, user visibility, source documents, and citations before deciding whether to reuse the answer.

This page is a management view. It supports browsing, filtering, and elimination, but not manual creation, editing, or restoration.

## Roles & Prerequisites

- **Role**: Agent Admin (the backend requires `AGENT_ADMIN` or `SYS_ADMIN`; the menu normally maps to `rag:experience:list`).
- **Creation conditions**: a knowledge answer has valid citations and passes automatic quality evaluation. Answers generated from session attachments are not added.

## How to Access

Main menu: **Agent Management → Experience Pool**.

## Steps

### 1. Review Statistics and Records

- The cards show tenant-wide **Total / Active / Eliminated** counts. They do not change with list filters.
- Records are ordered by last-hit time and creation time descending. Page sizes are 10 / 20 / 50 / 100.
- The list shows question, quality score, hit count, visibility, and last-hit time.

### 2. Filter Experiences

1. Enter text from the question in Keyword; it matches the **question text only**.
2. Optionally select public, department, post, or user visibility.
3. Optionally enter a minimum quality score from 0 to 1 in 0.05 increments.
4. Click **Search**. **Reset** clears all conditions and returns to page 1.

### 3. View Details

Click **Details** to view the full question, answer, visibility, and citations. A citation may contain a file name, anchor, and snippet. Older or malformed citation data falls back to source chunk IDs.

Citations are snapshots saved when the experience was created. Before reuse, the backend rechecks that source chunks and files still exist and validates the current user's ACL. If a source is deleted or no longer visible, the record can remain listed but will not be reused.

### 4. Eliminate an Experience

1. **Delete** is available only for an active record.
2. After confirmation, the system withdraws its Redis cache and then marks the database record as eliminated.
3. The record remains in the list and statistics for traceability, but no longer participates in answering and its Delete action is disabled.

If cache withdrawal fails, elimination is rejected and the original state is preserved to avoid cache/database inconsistency. The current page has no restore action.

## Fields and Runtime Rules

| Field | Description |
|---|---|
| Question | Retrieval question used when the experience was created |
| Quality score | Automatic score based on answer and citation signals, from 0 to 1; not a manual rating |
| Hit count | Number of successful reuses |
| Visibility | Scope derived from source-document permissions: public / department / post / user |
| Last hit | Most recent successful reuse; `-` if never reused |
| Active / eliminated | Active records may be reused; eliminated records remain only for traceability |

Experience reuse is not semantic similarity search. The current implementation derives an exact key from the original question, then requires the candidate to be active, visible to the current user, backed by intact sources, properly cited, and safe to reuse.

## FAQ

**Why was no experience created after a successful knowledge answer?**
The answer may lack valid citations, miss the quality threshold, look like an insufficient-evidence/failure answer, or use a session attachment. Creation is automatic and cannot be forced from this page.

**Why did a similar question miss?**
The pool currently matches an exact question key rather than retrieving similar phrasing. A changed expression follows normal knowledge retrieval and generation.

**Does a user thumbs-up create an experience or raise its score?**
No. The current feedback API stores message feedback and creates negative Bad Cases. Experience creation and score come from answer/citation quality evaluation.

**Why is a listed record not reused?**
It may be eliminated, or its source documents/chunks may have been deleted, or current-user permissions or citation integrity may no longer pass revalidation.

## Tips & Boundaries

- Experiences are tenant-isolated and ACL is revalidated at reuse time. List visibility describes answer reuse, not whether an Agent administrator can view tenant records.
- Elimination is a soft disable. History remains and the page cannot reactivate it.
- Answers can become stale when business rules change. Review related experiences after updating or retiring source documents.
- Reuse currently checks source-record existence and ACL, not index status by itself. If a source is merely unindexed but retained, eliminate related experiences as well to prevent reuse of stale answers.
- A hit returns the stored answer and citations directly without another LLM rewrite. Eliminate wording that is stale, incomplete, or unsuitable for direct reuse.
