## Overview

The **Experience Pool** accumulates high-quality Q&A experiences (question + answer + citations) from agent sessions. During Q&A, the system prioritizes matched experiences to improve quality and efficiency for similar questions. This page is a management view: browse, filter and eliminate experiences; manual creation is not supported.

## Roles & Prerequisites

- **Roles**: Agent Admin (`rag:experience:list`).
- **Prerequisites**: Sessions have produced high-quality Q&A that the system automatically evaluated and stored.

## How to Access

Main menu: **Agent Management → Experience Pool**.

## Steps

### 1. Browse Experiences

- Top cards show **total / active / eliminated** counts;
- The list shows question, quality score, hit count, visibility and last hit time;
- Click **Details** for the full answer and citations (file name, snippet).

### 2. Filter Experiences

Filter by keyword, visibility (public/department/post/user) and minimum quality score (0–1) to evaluate quality distribution.

### 3. Eliminate Experiences

Click **Delete** to remove experiences that are no longer useful; they stop matching in Q&A afterwards.

> **Note** Deletion is irreversible; only experiences you are allowed to delete show an enabled button.

## Configuration Reference

### List Fields

| Field | Description |
|---|---|
| Question | The original question of the stored experience |
| Quality score | 0–1; higher is more reliable |
| Hits | Times matched by Q&A |
| Visibility | Who can hit this experience (public / department / post / user) |
| Last hit | Most recent match time |

## FAQ

**How are experiences created?**
The system automatically evaluates session answer quality and user feedback; manual creation is not supported.

**How can more questions hit the experience pool?**
Improve knowledge base quality and encourage positive feedback on good answers.

**Do experiences expire?**
No automatic expiry; they stop matching after quality decline or deletion.

## Tips & Boundaries

- Experience matching follows ACL: users only hit experiences within their visibility scope.
- Experiences are reference answers; final answers still combine current retrieval results to avoid stale guidance.
