## MCP Integration

MCP (Model Context Protocol) integration connects a tenant-owned read-only MCP Server to the Agent. EasyAgent manages the endpoint, handshake, cached tool catalog, Schema validation, tenant isolation, tool visibility, and event audit; the remote Server performs the actual query.

This pilot supports read-only tools only. Remote tools that write, delete, send, approve, or otherwise cause side effects are not added to the enableable catalog.

## Roles and prerequisites

- **Role**: `AGENT_ADMIN`. This role receives the MCP menu and create, edit, delete, validate, refresh, enable, and audit permissions by default.
- **Ordinary users**: cannot manage MCP Servers. Whether a tool can be used in chat also depends on tenant ownership, enabled state, and the tool visibility scope.
- **Remote prerequisite**: a Streamable HTTP MCP Server exposing read-only tools.
- **Production endpoint**: public HTTPS on an allowlisted host. EasyAgent resolves DNS immediately before requests and rejects private, loopback, or link-local addresses.
- **Local testing**: only `local`/`test` profiles may use `http://127.0.0.1` or `http://localhost` mocks. Never carry that setting into production.

## Recommended workflow

1. Open **Agent Management → MCP Integration** and click **Add MCP server**.
2. Enter a display name, stable code, and Streamable HTTP endpoint.
3. Choose None, API key, or Bearer authentication. Credentials are encrypted and never echoed.
4. Click **Validate** and confirm connection, protocol, and initialization success.
5. Click **Refresh catalog**. EasyAgent calls `tools/list` and keeps only tools with `readOnlyHint=true` and without `destructiveHint=true`.
6. Open each tool Schema and verify its input, output, and description.
7. Set `public`, `department`, `post`, or `user` visibility.
8. Enable only approved tools. They become discoverable and callable only within the current tenant and user scope.
9. Check **Event audit** for refresh and call results.

## Configuration reference

### Server fields

| Field | Description | Example |
|---|---|---|
| Name | Display name; include the system and environment | Enterprise assets (prod) |
| Code | Stable English code; avoid changing it after save | `enterprise_assets` |
| Endpoint | Streamable HTTP URL without user info, query, or fragment | `https://mcp.example.com/mcp` |
| Status | Whether the Server may be called; disabling it disables its tools | Enabled |
| Authentication | None, API key, or Bearer token | API key |
| Header name | Header used for an API key | `X-API-Key` |
| Credential | API key or Bearer token; submitted only when saving | Secret-manager value |

When editing, leave credentials blank to keep the current value. Changing authentication type requires the complete credential for the new type. Never put tokens in the endpoint, ordinary request headers, or tool descriptions.

### Catalog status

| Status | Meaning | Action |
|---|---|---|
| `ACTIVE` | Tool exists and its Schema is unchanged | Enable after review |
| `SCHEMA_CHANGED` | Input or output Schema changed | Automatically disabled; review before enabling |
| `REMOVED` | Tool was not returned by the remote catalog | Cannot be enabled; refresh after the remote tool returns |

Refreshing never enables new tools automatically and never adds unsafe tools. If refresh fails, the previous usable catalog remains and the Server records the error.

### Tool visibility

| Scope | Target | Required value |
|---|---|---|
| `public` | Current tenant | No extra ID |
| `department` | One department | Department ID |
| `post` | One post | Post ID |
| `user` | One user | User ID |

The same scope filter applies to catalog discovery, descriptions, and execution. Hiding a row in the page is not the security boundary; the backend re-checks tenant and user scope for every discovery and call.

## Examples

### Production Server

```text
Name: Enterprise assets (prod)
Code: enterprise_assets
Endpoint: https://mcp.example.com/mcp
Authentication: Bearer token
Status: Enabled
```

After refresh, the catalog may contain read-only tools such as:

```text
mcp__enterprise_assets__lookup_asset_8ea1dc27
mcp__enterprise_assets__list_assets_f4c249db
```

The model uses the stable platform name; EasyAgent maps it to the remote `lookup_asset` or `list_assets`. Do not edit the exposed name manually.

### Local mock Server

Use only with a local or test profile:

```text
Name: Local MCP test
Code: local_mcp
Endpoint: http://127.0.0.1:9089/mcp
Authentication: None
```

The local mock validates handshake, paginated discovery, Schema, and audit behavior. It is not a production security configuration.

## Schema and execution boundaries

- EasyAgent stores the input Schema, output Schema, annotations, and Schema hash.
- Arguments are validated before a call; structured output is validated after the call.
- Per-tool Schema and model-visible tool budgets are enforced. An over-budget refresh fails without deleting the previous catalog.
- The pilot does not support action tools, automation-node binding, or OAuth authorization flows.
- Remote MCP content is untrusted data. Instructions returned by a tool never grant platform permissions or override policy.

## Health, audit, and troubleshooting

### Health states

- `unknown`: no successful validation or refresh yet.
- `healthy`: the latest handshake and catalog refresh succeeded.
- `unhealthy`: connection, protocol, Schema, or remote call failed.
- `disabled`: the Server was disabled.

### Common issues

**The endpoint is rejected as non-public HTTPS**

Check for HTTP, a custom port, user info, query string, fragment, or a private hostname. Production cannot use loopback; local mocks require a local/test profile.

**Refresh returns no tools**

Remote tools must set `readOnlyHint=true` and must not set `destructiveHint=true`. Check remote annotations and the returned `inputSchema`.

**A tool becomes `SCHEMA_CHANGED`**

This is intentional protection. Review the new Schema and read-only contract, then enable it manually; do not edit database state directly.

**A tool call fails**

Check Server health and audit error codes first, then the allowlist, DNS result, credential, protocol version, timeout, and output Schema. Never print or submit credentials in a request header.

**How do I confirm that a call was recorded?**

Open **Event audit** and filter `MCP_CATALOG_REFRESHED` or `MCP_TOOL_CALL`. Both successful and failed calls are recorded with a stable error code and remote outcome state.

## Disable and change management

Clicking **Disable** disables the Server and its tools without deleting historical audit events. Before enabling it again, validate the endpoint and refresh the catalog.

For production changes: disable tools, record current Schema hashes and audit events, change the remote Server, refresh, review `SCHEMA_CHANGED`/`REMOVED`, and re-enable only after human review.
