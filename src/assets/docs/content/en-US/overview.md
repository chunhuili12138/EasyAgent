## What is EasyAgent

EasyAgent is an enterprise-grade **RAG question answering and Agent automation platform**. You can connect enterprise documents, databases, and external APIs to the platform, so that AI can handle knowledge retrieval, data analysis, and repetitive business tasks through knowledge-based Q&A and automated workflows.

The platform is built around five core capabilities:

| Capability | Description |
|---|---|
| Multi-tenant management | Each tenant has an independent organization structure and data isolation, with user, department, post management and quota control |
| Document processing | Upload PDF, Word, PPT, Excel and images; manually submit parsing and data processing, review results, then import them into Elasticsearch |
| RAG knowledge Q&A | Hybrid retrieval + reranking + evidence citations; answers include sources, with session memory and attachments |
| Agent orchestration | Skills orchestrate "retrieve, query database, call API, ask LLM" steps; high-risk operations require human approval (HITL) |
| Automation Center | Visually orchestrate cross-system workflows triggered by schedules, internal events, webhooks or approval callbacks, with retry and recovery on failure |

> **Tip** This guide targets tenant users of all roles. Sys-admin-only features are out of scope.

## Usage Flow

### Quick Start

```flow
Log in to the platform
Upload documents and submit parsing
Review processing results and import them
Start a chat session and ask questions
Review citations and feedback

```

### Full Journey

1. **Log in**: Use the account assigned by your tenant admin, and switch to your tenant from the top-right switcher if needed.
2. **Prepare the knowledge base (Document Processing)**: Upload files under "Document Processing → File Management" and submit parsing manually. After parsing succeeds, submit data processing under "Parse Management", review and fix chunks, then click "Import to Knowledge Base" under "Data Processing" to write searchable data to Elasticsearch. There is no separate create-knowledge-base action; the knowledge base consists of imported searchable data.
3. **Configure Q&A capabilities (Agent Management)**: Users with agent admin rights configure datasources, Skills, API tools and the experience pool, controlling what the AI can do, what it can query, and who must approve.
4. **Use the chat (Agent Workbench)**: Start a session and ask questions; answers include citations from the knowledge base. Attachments can scope the retrieval within a session.
5. **Orchestrate automation (Automation Center)**: Turn repetitive flows (scheduled summaries, internal events, webhooks or approval callbacks) into workflows, publish them, configure triggers, and intervene when failures occur.

## Roles & Permissions

| Role | Responsibility | Main scope |
|---|---|---|
| Tenant Admin | Maintain organization and accounts of the tenant | Users, departments, posts |
| Document Processor | Manage knowledge base and document pipeline | Knowledge base, files, parsing, processing |
| Q&A User | Use knowledge Q&A | Agent workbench chat |
| Agent Admin | Maintain agent capabilities and automation | Skills, datasources, tools, experience pool, audit, Automation Center |

> **Note** Menus and permissions are assigned by the tenant admin through roles; you may only see the features you are authorized for.

## FAQ

**Why can't the chat find my document content?**
Make sure parsing and data processing are complete and the file shows **indexed** under "Data Processing". Also confirm that the current user is authorized to access the document.

**What if a document fails to parse?**
Check the failure reason under "Parse Management" and retry. If it keeps failing, check whether the file format and size are supported.

**Why is there no citation in the answer?**
When retrieval evidence is insufficient, the platform answers conservatively rather than making things up. Try rephrasing your question or enriching the knowledge base.

## Tips

- Documents, datasources and API tools are protected by ACL and tenant isolation; permissions are configured by the tenant admin.
- High-risk operations against external systems require human approval (HITL) before continuing.
- Whether the automation engine is enabled is controlled by platform configuration. If it is disabled, contact the platform admin; after it is enabled, publish the workflow and enable its trigger.
