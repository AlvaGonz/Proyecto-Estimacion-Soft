---
name: gh-cli
description: 'Comprehensive assistant for using the GitHub CLI (gh) for repo and project operations.'
---

# GitHub CLI Reference

## Common Commands
- **Repos**: `gh repo view`, `gh repo clone`, `gh repo create`.
- **Issues**: `gh issue list`, `gh issue create`, `gh issue view`.
- **PRs**: `gh pr list`, `gh pr status`, `gh pr checkout`, `gh pr create`.
- **Actions**: `gh run list`, `gh workflow view`.
- **Secrets**: `gh secret set`.

## Best Practices
- Use `gh auth status` to verify permissions.
- Use `--json` and `--jq` for parsing output in scripts.
- Use `gh browse` to open the web view quickly.
