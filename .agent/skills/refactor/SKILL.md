---
name: refactor
description: 'Surgical code refactoring to improve maintainability and type safety.'
---

# Refactor Principles

## Golden Rules
- **No Behavior Change**: Tests must pass before and after.
- **Small Steps**: Make one tiny change at a time and verify.
- **Types First**: Improve type safety before changing logic.

## Common Operations
- **Extract Method/Function**: Move logic to a helper for clarity.
- **Rename Variable/Function**: Use more descriptive, context-aware names.
- **Introduce Guard Clauses**: Flatten nested conditionals.
- **Remove Magic Strings/Numbers**: Replace with constants or enums.
- **Eliminate Duplication (DRY)**: Centralize repeating logic.

## Workflow
1. Identify a "code smell" (complexity, duplication, poor typing).
2. Ensure test coverage exists for the area.
3. Apply the refactoring.
4. Verify with tests and code analysis.
