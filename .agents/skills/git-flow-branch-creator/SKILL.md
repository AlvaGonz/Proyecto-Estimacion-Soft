---
name: git-flow-branch-creator
description: 'Analyzes changes and creates feature/bugfix branches following Git Flow.'
---

# Git Flow Branch Creator

## Naming Conventions
- **Feature**: `feature/RF###-description` or `feature/short-description`.
- **Bugfix**: `fix/issue-id-description`.
- **Hotfix**: `hotfix/vX.Y.Z-description`.

## Workflow
1. **Analyze Status**: Check pending changes and current task context.
2. **Suggest Name**: Propose a branch name based on conventions.
3. **Update AGENTS.md**: Ensure the branch purpose is noted if significant.
4. **Create**: `git checkout -b <name>`.
