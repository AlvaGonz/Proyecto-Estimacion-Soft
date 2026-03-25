---
name: refactor-method-complexity-reduce
description: 'Refactor method to reduce cognitive complexity by extracting helper methods.'
---

# Reduce Method Complexity

## Objective
Refactor a specific method to reduce its cognitive complexity to a target threshold (default: 10) by extracting logic into focused helper methods.

## Instructions
1. **Analyze Sources of Complexity**: Nested conditionals, switch chains, repeated blocks, complex boolean logic.
2. **Extract Helpers**: Move validation, data transformations, or case-specific logic into private/static helper methods.
3. **Simplify Main Flow**: The main method should read like a high-level orchestration of helpers.
4. **Preserve Behavior**: Maintain identical input/output, errors, and validation.

## Verification Checklist
- [ ] Code compiles.
- [ ] **Tests pass (failed=0)**.
- [ ] Complexity metric is below threshold.
- [ ] Functional parity is maintained.
