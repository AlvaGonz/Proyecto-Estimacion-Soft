---
name: refactor-plan
description: 'Plan a multi-file refactor with proper sequencing and rollback steps'
---

# Refactor Plan

## Instructions
1. **Search**: Understand the current state and dependencies.
2. **Identify**: List all affected files.
3. **Sequence**: Plan changes safely (Types → Services → Controllers → Tests).
4. **Verify**: Define success criteria for each step.
5. **Rollback**: Plan how to undo changes if something breaks.

## Template
```markdown
## Refactor Plan: [title]

### Current State
[Current logic/structure]

### Target State
[Improved logic/structure]

### Affected Files
| File | Change | Dependencies |
|------|--------|--------------|

### Execution Plan
#### Phase 1: Types/Interfaces
- [ ] Task 1.1: ...
#### Phase 2: Implementation
- [ ] Task 2.1: ...
#### Phase 3: Tests & Cleanup
- [ ] Task 3.1: ...

### Rollback Plan
[Steps to revert]
```
