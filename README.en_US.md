# EasyAgent Frontend

This repository contains the administration and conversational frontend for EasyAgent. It is built with Vue 3, TypeScript, Vite, Element Plus, Pinia, and UnoCSS.

## Features

- System administration, tenant usage, users, departments, posts, menus, dictionaries, and logs.
- Document upload, ACL, parsing, processing, quality inspection, and knowledge-base browsing.
- Agent Workbench for smart sessions, attachments, retrieval, plans, tool execution, and HITL.
- Agent Management for data sources, NL2SQL schemas, API tools, Skills, audits, and BadCase analysis.
- Backend-driven dynamic routes and tenant-aware page reset behavior.
- Chinese and English localization.

## Requirements

- Node.js 20.19+
- pnpm 8.7+
- A running EasyAgent backend

## Development

Run from the repository root:

```powershell
pnpm install
pnpm dev
```

The default development URL is `http://localhost:9527`.

## Verification

```powershell
pnpm typecheck
pnpm build
```

The `lint` command applies fixes and modifies files. Review its diff after running it.

## License and attribution

This frontend is derived from [SoybeanAdmin](https://github.com/soybeanjs/soybean-admin). Its MIT license and original copyright notice are preserved in [LICENSE](LICENSE).
