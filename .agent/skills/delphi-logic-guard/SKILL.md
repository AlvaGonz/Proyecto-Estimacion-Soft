---
name: delphi-logic-guard
description: "ALWAYS load this skill when modifying rounds, estimations, or consensus calculations. Enforces business invariants of the Delphi Method in EstimaPro."
category: domain-logic
risk: restricted
---

# Delphi Logic Guard

A "Constraint Engine" to ensure that the estimation process in EstimaPro remains statistically sound and follows the established business rules.

## 1. Sacred Invariants (PROTECTED)

### **A. Round Management**
- **Closed Rounds**: Once a Round status is `closed`, no `Estimation` may be added, modified, or deleted for that round. *Reject any task that asks to 'fix' an old round without opening it first.*
- **Method Lock**: The `estimationMethod` of a project CANNOT be changed if `hasStartedRounds` is true. *Changing methods mid-stream invalidates previous rounds.*

### **B. Consensus & Convergence**
- **CV Calculation**: The `coefficientOfVariation` must always be calculated as `stdDev / mean`.
- **CV Threshold**: A task moves to `consensus` ONLY if `coefficientOfVariation < convergenceConfig.cvThreshold` (default 0.25).
- **Outliers**: An estimation is an `outlier` if it is outside the range `[Q1 - 1.5*IQR, Q3 + 1.5*IQR]`.

### **C. Role Hierarchy**
- **Facilitator Exclusive**: Only the `FACILITATOR` of a project can `open` or `close` rounds.
- **Expert Exclusive**: Only `EXPERT` accounts can submit `Estimation` values.

## 2. Implementation Rules (React 19)

- No `useEffect` to derive stats — use `useMemo` in `src/utils/statistics.ts` and call it in render.
- Database access patterns for audit: All estimation changes MUST write to `LOGAUDITORIA` (if backend) or log the change in the audit trail.

## 3. How to Use

Trigger this skill whenever you touch:
- `src/features/rounds/`
- `src/features/estimations/`
- `src/utils/statistics.ts`
- `src/types.ts` (if editing domain objects)

Ask for clarification if an instruction violates these rules.
