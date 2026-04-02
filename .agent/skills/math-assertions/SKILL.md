---
name: math-assertions
description: "Statistical verification and mathematical assertions for E2E tests."
risk: low
source: project
date_added: "2026-04-02"
---

# Math Assertions

Use these assertions to verify statistical engine correctness in E2E tests.

## 1. Core Formulas Reference
| Metric | Calculation |
|---|---|
| **Mean** | `sum(vals) / n` |
| **Median** | Sorted `vals[n/2]` or avg of middle two |
| **Variance** | `sum((x - mean)^2) / n` |
| **Std Dev (σ)** | `sqrt(variance)` |
| **CV (Coefficient of Variation)** | `(stdDev / mean) * 100` |

## 2. Playwright Assertions
Verify that the UI displays values matching the expected calculations.

```typescript
const values = [10, 20, 30];
const expectedMean = "20.00";
await expect(page.getByTestId('stats-mean')).toHaveText(expectedMean);
```

## 3. Tolerance & Rounding
Always use standard rounding to 2 decimal places as defined in `src/shared/utils/statistics.ts`.

## 4. Edge Cases
- **n < 2**: CV should be 0 or handle gracefully.
- **mean = 0**: CV should handle division by zero.
- **Large Dispersion**: CV > 50% should trigger "Baja Coherencia".
