## Overview

**Agent Workbench (Intelligent Chat)** is the main interaction entry with the platform AI: answering enterprise questions with knowledge retrieval, Skill orchestration and tool execution. Sessions support scoped attachments, citations, human approval (HITL), feedback labeling and execution tracking.

## Roles & Prerequisites

- **Roles**: Q&A users (`rag:chat`); other roles can also use authorized chat capabilities.
- **Prerequisites**: Knowledge base data exists (without it, AI can only use generic capabilities); complex tasks require Skills, datasources and tools configured by admins.

## How to Access

Main menu: **Agent Workbench → Intelligent Chat**.

## Steps

### 1. Create & Select Sessions

- The left list shows history (sorted by time); click to switch;
- Click **New Session** to start fresh; sessions can be **pinned**.

### 2. Ask a Question

Type in the input box (`Enter` to send, `Shift+Enter` for a new line). Answers stream in real time and can be **stopped**.

> **Tip** Answers rely on knowledge base coverage and quality; phrase questions clearly for better retrieval.

### 3. Choose an Answer Mode

- **Auto (`auto`)**: the system decides between knowledge Q&A and general chat; session attachments are preferred when present.
- **Knowledge only (`knowledge`)**: use only the knowledge base and session attachments; insufficient evidence does not fall back to general chat.
- **General chat (`general`)**: use the model's public knowledge; this does not represent enterprise policies or internal facts.

The current user selects the mode beside the input box. It is sent as the `mode` request field and is not a tenant-admin setting.

### 4. Scope with Attachments

- Click the attachment button next to the input to upload files (PDF, images, etc.); attachments participate only in the current session;
- Once uploaded ("ready"), questions are answered with attachment context prioritized.

### 5. Review Citations

Citations (source file, chunk, snippet) are shown with answers; click to view the original. When evidence is insufficient, the AI answers conservatively and says so.

### 6. Human Approval (HITL)

For high-risk operations (external API calls, SQL execution), the session pauses with an **approval request**: review the tool input and context, then **Approve / Reject**. Rejection terminates the task. Records are traceable under "Operation Audit".

### 7. Provide Feedback

Click **Feedback** on unsatisfactory answers: choose a type (factual mismatch, instruction not followed, format issue, content error, incomplete answer, irrelevant answer, other) with optional details. Feedback flows to "Bad Case Analysis".

## Configuration Reference

### Session Behavior

| Behavior | Description |
|---|---|
| Session memory | Context persists within a session only |
| Attachment scope | Attachments are session-local |
| Answer mode | `auto` decides automatically, `knowledge` uses only knowledge and attachments, `general` uses general model knowledge |
| Stop generation | Interrupts streaming; generated content remains |
| Task status | Complex tasks show step status (retrieval, SQL, tools, etc.) |

## FAQ

**The answer is not what I expected?**
Check whether the knowledge base covers the question; add attachments, rephrase, or report feedback so admins can improve.

**Why no citations in the answer?**
In `knowledge` mode, insufficient retrieval evidence is reported as insufficient material. In `auto` mode, the system may switch to a general answer. `general` mode does not retrieve enterprise knowledge and therefore does not produce knowledge-base citations.

**Why don't my attachments take effect?**
Confirm attachments finished uploading ("ready"); pending uploads do not participate in answering.

**How do I see the executed steps?**
Answer or session details show the step status: retrieval, SQL, tool calls, approvals, etc.

## Tips & Boundaries

- Session content and attachments are tenant-isolated and permission controlled.
- High-risk external operations always enter approval; do not attempt to bypass.
- Use the feedback feature to help improve answer quality continuously.
