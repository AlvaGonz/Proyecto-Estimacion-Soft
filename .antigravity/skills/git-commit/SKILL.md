---
name: git-commit
description: 'Execute git commit with conventional commit message analysis, intelligent staging, and message generation.'
---

# Git Commit with Conventional Commits

## Conventional Commit Format
`<type>[optional scope]: <description>`

## Workflow
1. **Analyze Diff**: `git diff --staged` or `git diff`.
2. **Stage Files**: `git add` related files (avoiding secrets like `.env`).
3. **Generate Message**: Use imperative mood (e.g., "add", not "added").
4. **Execute**: `git commit -m "type(scope): description"`.

## Safety Protocol
- NEVER force push to main.
- NEVER commit secrets.
- Keep descriptions under 72 chars.
