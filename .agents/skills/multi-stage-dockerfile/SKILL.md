---
name: multi-stage-dockerfile
description: 'Create optimized multi-stage Dockerfiles for any language or framework'
---

# Optimized Dockerfiles

## Multi-Stage Workflow
1. **Build Stage**: `FROM base AS builder`. Install dependencies, compile, and run tests.
2. **Runtime Stage**: `FROM minimal-base`. Copy only necessary artifacts (`/app`, `/node_modules`) from the builder stage.

## Layer Optimization
- Order layers by frequency of change (e.g., `package.json` before `src/`).
- Combine `RUN` commands with `&&` to reduce layers.
- Use `.dockerignore` to exclude local artifacts (`dist`, `.git`).

## Security
- Do NOT run as root (`USER node` or similar).
- Use exact version tags (e.g., `node:20-alpine`).
- Remove build tools/secrets from the final image.
