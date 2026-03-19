---
name: create-github-pull-request-from-specification
description: 'Assists in creating Pull Requests that align with feature specifications.'
---

# PR from Specification

## Workflow
1. **Requirement Check**: Read the spec to ensure all criteria are met in the code.
2. **Template**: Use `.github/pull_request_template.md` if available.
3. **Draft**: Create a draft PR using `create_pull_request`.
4. **Refinement**: Update title and body with specific details from the spec and the current diff.
5. **Ready**: Transition to "Ready for Review".

## Best Practices
- Mention implemented requirements.
- Link corresponding issues.
- Provide a summary of changes.
