## Overview

**Data Processing** is the core of the document pipeline: it runs **chunking → labeling → saving → summarization → QA generation** on parsed content to produce structured knowledge slices. You can review and manually fix chunks (content, summary, tags, QA) here, then **import them into the knowledge base** (generate vectors and write to Elasticsearch) for Q&A retrieval.

## Roles & Prerequisites

- **Roles**: Document Processor (`document:process:list`).
- **Prerequisites**: Records with parse status "done" and not yet processed.

## How to Access

Main menu: **Document Processing → Data Processing**. The **?** button opens the in-page "Processing Guide".

## Steps

### 1. Submit Processing

Click **Submit Processing / Batch Process** on the Parse Management page; tasks appear here with step progress (chunk → label → save → summarize → QA) and queue position.

### 2. Review & Fix Results

1. When status is **done**, click **Results** to open the full-screen dialog.
2. Left: chunk tree — parent/child chunks by structure; quality dots (green ≥85, orange 65–84, red <65); searchable by content.
3. Right: four tabs to view/edit — **Content**, **Summary**, **Tags**, **QA**.
4. Click **Edit current chunk**, modify, then **Save current edit**; switching chunks with unsaved changes prompts confirmation.

> **Tip** The Tags tab shows inherited tags (year, document type, department, post, security level — read-only) plus editable keywords and custom key-value tags. Some tag keys are protected.

### 3. Import to Knowledge Base

- When **done**: click **Import to Knowledge Base** to generate vectors and write to Elasticsearch (large files can take a while; API timeout is 10 minutes);
- When **indexed**: the button becomes **Update Knowledge Base** — replace the indexed version with the current result.

### 4. Failure Handling

- On **failed**: click **Retry** to reprocess;
- Alternatively reprocess or delete on the Parse Management page.

### 5. Delete

Deleting removes the knowledge base data as well; the parse record returns to "not processed".

## Status Reference

| Status | Meaning | Available actions |
|---|---|---|
| Pending | Submitted, queued | None (queue position visible) |
| Processing | Chunking/labeling/summarizing/QA in progress | None |
| Indexing | Generating vectors, writing to ES | None |
| Done | Processed, not yet imported | Results, Import |
| Indexed | Written to knowledge base | Results, Update |
| Failed | Processing error | Retry, delete |

## Result Dialog Statistics

| Metric | Description |
|---|---|
| Total / parent / child chunks | Structure size |
| QA count / section coverage | QA generation coverage |
| Average / min quality score | Slices below 65 count as low quality |
| LLM calls / token cost | Processing cost |
| Duration | Start to completion time |

## FAQ

**Why is "Import" disabled?**
Only "done" or "indexed" rows can import; unsaved chunk edits also disable it temporarily — save first.

**What if import times out or fails?**
Retry with **Update Knowledge Base** later; if it keeps failing, check the embedding model service.

**Does editing a chunk update the knowledge base immediately?**
No. Edits only change processing results; retrieval data updates only after **Import / Update Knowledge Base**.

## Tips & Boundaries

- Q&A retrieves from Elasticsearch — always run "Update Knowledge Base" after content changes.
- Tags like security level inherit from File Management; change the scope there and re-import.
- Fix low-quality chunks (<65) before importing to improve answer accuracy.
