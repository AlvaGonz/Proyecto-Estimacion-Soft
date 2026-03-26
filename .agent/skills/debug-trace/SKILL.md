# debug-trace
## Description
A systematic error log analysis and fix cycle triggered by log traces or test failures.

## Workflow
1. Read the error trace or log output from the terminal or report.
2. Reproduce the error with a minimal test case (TDD).
3. Identify the root cause (not just the symptom).
4. Propose and apply a fix following the Plan-Act-Validate cycle.
5. Verify the fix by running the reproduction test and relevant regressions.
6. Document the lesson learned in tasks/lessons.md.

## Constraints
- Do not apply "band-aid" fixes that mask deeper issues.
- Always write a failing test first if the error is reproducible.

## Resources
- .agent/rules/testing.md
- tasks/lessons.md
- tasks/error-patterns.md
