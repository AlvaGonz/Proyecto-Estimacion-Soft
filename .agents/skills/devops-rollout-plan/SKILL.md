---
name: devops-rollout-plan
description: 'Generate comprehensive rollout plans with verification signals and rollback procedures.'
---

# DevOps Rollout Plan

## Plan Structure
1. **Executive Summary**: What/Why/When/Who.
2. **Preflight Checks**: Infrastructure health, backups, and dependencies.
3. **Rollout Steps**: Phased deployment with specific commands.
4. **Verification Signals**: Health checks, error rate monitoring (2m, 5m, 15m marks).
5. **Rollback Procedure**: Clear triggers and automated steps to revert.
6. **Communication**: Stakeholder notification plan.

## Golden Rules
- NEVER deploy on Friday afternoon.
- ALWAYS have a tested rollback plan.
- ALWAYS communicate before and after.
