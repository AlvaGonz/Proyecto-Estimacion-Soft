---
name: context-map
description: 'Generate a map of files relevant to a task before making changes.'
---

# Context Map

## Objective
Analyze the codebase and task description to create a visual/list map of dependencies and affected files.

## Output Format
```markdown
### Files to Modify
| File | Purpose | Changes |

### Dependencies
| File | Relationship |

### Tests
| Test | Coverage |

### Reference Patterns
| File | Pattern | # Follow this |
```

## Risks
Identify breaking changes, DB migrations, or config updates before starting.
