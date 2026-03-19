---
name: typescript-mcp-server-generator
description: 'Generate a complete MCP server project in TypeScript with tools, resources, and proper configuration'
---

# Generate TypeScript MCP Server

## Requirements
1. **Structure**: TypeScript/Node.js project.
2. **Packages**: `@modelcontextprotocol/sdk`, `zod@3`.
3. **Transport**: HTTP (Streamable) or Stdio.
4. **Validation**: Zod for tool input/output.
5. **Quality**: ES modules, async/await, clear separation of concerns.

## Implementation Steps
- `npm init` (type: module).
- Install dependencies.
- Configure `tsconfig.json`.
- Implement `McpServer` with `registerTool`.
- Return `content` and `structuredContent`.

## Testing
- Use MCP Inspector: `npx @modelcontextprotocol/inspector`.
- Provide run commands (`tsx server.ts`).
