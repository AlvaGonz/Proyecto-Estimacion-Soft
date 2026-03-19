---
name: create-github-action-workflow-specification
description: 'Generates a formal specification for existing or new GitHub Actions workflows.'
---

# GitHub Actions Specification

## Core Components
- **Triggers**: `push`, `pull_request`, `workflow_dispatch`.
- **Jobs**: Build, Test, Lint, Deploy.
- **Environment**: Secrets (GH_TOKEN, MONGO_URI) and variables.
- **Outputs**: Job artifacts or status signals.

## Template Section
- Description of the workflow's purpose.
- Mermaid diagram of the sequence.
- Detailed step-by-step breakdown.
- Validation strategy for the CI/CD pipeline.
