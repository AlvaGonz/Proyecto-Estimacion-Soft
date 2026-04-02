---
name: playwright-pom
description: "Expert Page Object Model (POM) structure for Playwright tests."
risk: low
source: project
date_added: "2026-04-02"
---

# Playwright POM

Enforce the Page Object Model (POM) pattern for UI interactions to avoid brittle tests.

## 1. Page Object Pattern
Each page or major UI section should have its own class.

| Class | UI Section |
|---|---|
| `StatsResultsPage.ts` | `EstimationCharts.tsx` + `RoundAnalysisVerdict.tsx` |
| `ConvergenceIndicator.ts` | `ConvergenceIndicator.tsx` (Small component) |

## 2. Directory Structure
```
e2e/
├── pages/
│   ├── StatsResultsPage.ts
│   └── ConvergenceIndicator.ts
├── tests/
│   └── stats-convergence.spec.ts
└── fixtures/
    └── stats-data.json
```

## 3. Best Practices
- **Locators**: Use `page.getByTestId`, `page.getByRole`, or `page.getByLabel`.
- **Actions**: Explicitly call methods like `fillEstimation`, `startNextRound`.
- **Assertions**: Return or use expect within the class if needed, or keep it in the test.
- **Fluent Interface**: Return `this` for chaining if appropriate.

## 4. Selector Strategies
If `data-testid` is missing, use:
- **Heading**: `getByRole('heading', { name: 'Análisis Estadístico' })`
- **Text**: `getByText(/CV: .*%/)`
- **Container**: `locator('.boxplot-stats')` (Use class if unique)
