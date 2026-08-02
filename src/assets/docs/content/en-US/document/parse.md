## Overview

**Parse Management** is the second stage of the document pipeline: converting uploaded raw files into structured Markdown with quality assessment. You can review the parsed content and quality metrics, then **submit data processing** to move into chunking and vectorization.

## Roles & Prerequisites

- **Roles**: Document Processor (`document:parse:list`).
- **Prerequisites**: Files have been uploaded (status "parsed" or "not parsed" on the File Management page).

## How to Access

Main menu: **Document Processing → Parse Management**. The **?** button at the top-right opens the in-page "Parsing Guide".

## Steps

### 1. Start Parsing

After clicking **Parse / Batch Parse** on the File Management page, tasks appear here. You can also **Retry** failed parse tasks in this page.

### 2. Review Results

- **View content**: click **View Content** to inspect the parsed Markdown; click **Edit** to fix content manually (saving does not recompute the quality score).
- **View metrics**: if parse details exist, click **Metrics** to see parser type, OCR pages, preprocessing and fallback records.

### 3. Submit Data Processing

- When parse status is **done** and not processed yet, click **Submit Processing**;
- The system shows the quality score (0–100) before confirming;
- Select multiple rows for **Batch Process(N)** (only rows parsed and not processed).

### 4. Reprocess & Retry

- **Reprocess**: available when processing is complete; regenerates chunks (clears old chunks and indexed data if already imported).
- **Retry processing**: available when processing failed.

### 5. Delete Parse Record

Deleting removes processing results and knowledge base data; the file returns to "not parsed" and can be parsed again.

## Status Reference

| Status | Meaning | Available actions |
|---|---|---|
| Pending / Processing | Queued or running (auto-refresh every 20s) | None |
| Done | Parse complete; score color green (≥70) / orange (50–69) / red (<50) | Submit processing, view content, metrics |
| Failed | Parse error | Retry, delete |

### Processing Status

| Status | Meaning |
|---|---|
| Not processed | Data processing not submitted |
| Processing | Data processing in progress |
| Processed | Complete; view results and import on Data Processing page |
| Processing failed | Error; retry available |

## Quality Score Reference

| Range | Color | Suggestion |
|---|---|---|
| ≥ 70 | Green | Ready to submit |
| 50 – 69 | Orange | Review content and fix obvious issues |
| < 50 | Red | Re-parse or check the source file quality |

> **Note** Manually editing content does not change the quality score; the score is a reference. Final import is decided on the Data Processing page.

## FAQ

**Why "execution queue is full"?**
The task was kept as pending automatically and will be rescheduled; no need to resubmit.

**Why "task is already queued or running"?**
The task is already submitted or executing; wait for the status to refresh.

**When to reprocess?**
Reprocessing regenerates chunks, summaries and QAs from the latest parsed content; if already imported, the old version is replaced.

## Tips & Boundaries

- Manual Markdown edits do not trigger re-assessment; edit carefully.
- Retrying a failed parse is not guaranteed to succeed; check the source file for blurry scans or unsupported formats.
- Deleting a parse record is irreversible and cascades to processing results and knowledge base data.
