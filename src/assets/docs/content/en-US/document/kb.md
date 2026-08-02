## Overview

**Knowledge Base** lets you search indexed chunks. When you ask questions in the chat, the platform performs hybrid retrieval over the knowledge base and attaches citations. This page allows verifying that a file is searchable — filter by keyword, department, security level and year — and **removing data from the knowledge base**.

## Roles & Prerequisites

- **Roles**: Document Processor (`document:kb:list`).
- **Prerequisites**: Files have been imported via Data Processing; Elasticsearch contains retrieval data.

## How to Access

Main menu: **Document Processing → Knowledge Base Data**.

## Steps

### 1. Search Indexed Data

Enter a keyword (matches content/summary) at the top, optionally combined with **department, security level, year** filters, then click **Search**. Each row is an Elasticsearch **chunk** result; one file may produce multiple rows showing the source file, level, summary and content snippet.

> **Tip** Security level tag colors indicate scope: specific user (red), specific post (orange), specific department (blue), public (grey).

### 2. View Details

Click **Details** to see the source file, chunk ID, tags, content, summary and hypothetical questions (QA).

### 3. Remove from Knowledge Base

Click **Remove** and confirm: only the file's Elasticsearch data is deleted; **file, parse record and processing results are kept**. Re-import from Data Processing whenever needed.

## Configuration Reference

### Filters

| Field | Description |
|---|---|
| Keyword | Fuzzy match on chunk content and summary |
| Department | Filter by tag |
| Security level | Public / department / post / user |
| Year | Filter by upload metadata |

### Page Metric

The top shows the total **chunk count**, useful for confirming successful imports.

## FAQ

**Why can't I find a freshly imported file?**
Confirm the file status is "indexed" on the Data Processing page; indexing is asynchronous — wait a moment after import.

**Does removing data affect Q&A?**
Yes. Removed files no longer participate in retrieval; re-importing restores them.

**Does removing delete the original file?**
No. Only ES retrieval data is deleted; the file, parse and processing records remain.

## Tips & Boundaries

- Retrieval automatically applies ACL filters: users only see data within their visibility scope.
- Changing a security level immediately removes that file's Elasticsearch retrieval data and returns its processing task to **done**. Run "Update Knowledge Base" on the Data Processing page to index it again with the new ACL.
