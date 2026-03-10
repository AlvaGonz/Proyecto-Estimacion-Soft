---
name: create-github-issue-feature-from-specification
description: 'Analyze a specification and create a corresponding GitHub Issue.'
---

# Issue from Specification

## Workflow
1. **Analyze**: Read `${file}` to extract requirements and scope.
2. **Search**: Use `search_issues` to avoid duplicates.
3. **Create**: Use `create_issue` with a clear title and description.
4. **Template**: Follow `feature_request.yml` or standard format.

## Requirements
- Title based on feature name.
- Description includes problem, solution, and context.
- Labels: `feature`, `enhancement`.
