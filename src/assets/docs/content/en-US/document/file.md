## Overview

**File Management** is the first stage of the document pipeline: uploading files, registering metadata and setting access permissions (ACL). After upload, you can submit files for parsing so the Parse Management stage can produce structured content.

It supports batch upload (click or drag), batch parsing, batch ACL updates, plus download, delete and re-parse for individual files.

## Roles & Prerequisites

- **Roles**: Document Processor (`document:file:list`).
- **Prerequisites**: Departments, posts and users exist in the tenant (for authorization scope); object storage is available.

## How to Access

Main menu: **Document Processing → File Management**.

## Steps

### 1. Upload Files

1. Click **Upload Files** at the top-right to open the upload dialog.
2. Click or drag files to select (PDF, DOC, DOCX, XLS, XLSX, PPT, PPTX, TXT, MD, HTML, CSV and common image formats; max **50MB** per file).
3. Fill in metadata (optional): year, document type, department, post, and set the **security level** (default "public").
4. For restricted levels, select the authorized departments/posts/users.
5. Confirm: files are uploaded directly to object storage with per-file progress. A failed file can be retried individually; if batch preflight or direct-upload ticket creation fails, resubmit the batch as instructed.

> **Tip** Duplicates are detected by **tenant + file-content MD5**, not by file name. Duplicate content is rejected; upload new content or handle the existing file record first.

### 2. Submit Parsing

- **Single file**: click **Parse** in the row (already parsed files show **Re-parse**).
- **Batch**: select multiple files and click **Batch Parse(N)**.
- If the selected files already have parse results, the system asks for confirmation to **overwrite and re-parse**.

### 3. Set ACL (Security Level)

- Click **Security Level** in the row to edit a single file's access scope;
- Select rows and click **Security Level(N)** for batch updates.

> **Note** Changing the security level immediately removes the file's Elasticsearch retrieval data and returns its processing task to **done**. To make it searchable again, re-import it (update the knowledge base) from Data Processing so the new ACL is indexed.

### 4. Other Operations

- **Download**: opens the original file in a new browser tab.
- **Delete**: removes the file together with its parse and processing records; not recoverable.

## Configuration Reference

### Upload Metadata

| Field | Required | Default | Description |
|---|---|---|---|
| Year | No | Current year | Used for knowledge base filtering |
| Document type | No | - | 22 types (approval, notice, report, contract, manual, standard, etc.), typeable to create |
| Department | No | - | Tree select; loads posts of the selected department |
| Post | No | - | Only posts under the selected department |
| Security level | Yes | Public | Public / specific department / specific post / specific user |
| Authorized depts/posts/users | Per level | - | Required when the level is restricted (multi-select) |

### Parse Status

| Status | Meaning |
|---|---|
| Not parsed | Uploaded, parsing not submitted |
| Parsing | Parse task in progress (auto-refresh every 20s) |
| Parsed | Parse complete; ready for data processing |
| Parse failed | Parsing error; retry or delete and re-upload |

## FAQ

**Why does the file stay "not parsed" after upload?**
Upload only registers the file; click **Parse** (or batch parse) to start parsing.

**What if an upload fails?**
The dialog shows the first error; common causes are network issues or files over 50MB. Retry, or convert unsupported formats first.

**How do I make a file visible only to one department?**
Choose "specific department" as the security level and select the target department. Search results are filtered by ACL automatically.

## Tips & Boundaries

- Deleting a file cascades to parse and processing results; confirm before deleting.
- ACL is document-level; knowledge base retrieval also applies user department/post filters.
- Resume-upload is not supported; consider splitting very large files.
