# OVERHAUL-E2E-007: Fix cookie cross-port + audit completo

## Auditoría de Tests (43 tests en 5 specs)

### dashboard.spec.ts (12 tests)
| Test | Depende de | Estado | Issues |
|------|-----------|--------|--------|
| T030 | loginAs | 🟡 | - |
| T031 | networkidle | 🟡 | Selector frágil por clases Tailwind |
| T032 | loginAs + navegación | 🟡 | - |
| T033 | loginAs | 🟡 | - |
| T034 | loginAs | 🟡 | - |
| T035 | createProjectViaWizard | 🔴 | **Step 4 depende de expertos** |
| T036 | loginAs | 🟡 | - |
| T037 | loginAs | 🟡 | - |
| T038 | loginAs | 🟡 | - |
| T039 | loginAs | 🟡 | - |
| T040 | loginAs | 🟡 | - |
| T041 | loginAs | 🟡 | - |

### projects.spec.ts (10 tests)
| Test | Depende de | Estado | Issues |
|------|-----------|--------|--------|
| T010 | Wizard step 1 | 🟡 | - |
| T011 | Wizard step 1-2 | 🟡 | - |
| T012 | createProjectViaWizard | 🔴 | **Step 4** |
| T013 | createProjectViaWizard | 🔴 | **Step 4** |
| T014 | createProjectViaWizard | 🔴 | **Step 4** |
| T015 | createProjectViaWizard | 🔴 | **Step 4** |
| T016 | Wizard cancelar | 🟡 | - |
| T017 | Wizard steps | 🟡 | - |
| T018 | createProjectViaWizard | 🔴 | **Step 4** |
| T019 | createProjectViaWizard | 🔴 | **Step 4** |

### estimapro-flow.spec.ts (7 tests)
| Test | Depende de | Estado | Issues |
|------|-----------|--------|--------|
| T001 | loginAs | 🟡 | - |
| T002 | Login error | 🟡 | - |
| T003 | Login validación | 🟡 | - |
| T004 | loginAs | 🟡 | - |
| T005 | loginAs + navegación | 🟡 | - |
| T006 | loginAs + modal | 🟡 | - |
| T007 | loginAs + modal | 🟡 | - |

### estimation-rounds.spec.ts (8 tests)
| Test | Depende de | Estado | Issues |
|------|-----------|--------|--------|
| T020 | createProjectViaWizard | 🔴 | **Step 4** |
| T021 | createProjectViaWizard + tareas | 🔴 | **Step 4** |
| T022 | createProjectWithTask | 🔴 | **Step 4** |
| T023 | createProjectViaWizard | 🔴 | **Step 4** |
| T024 | createProjectViaWizard + tabs | 🔴 | **Step 4** |
| T025 | createProjectViaWizard | 🔴 | **Step 4** |
| T026 | createProjectViaWizard | 🔴 | **Step 4** |
| T027 | createProjectViaWizard | 🔴 | **Step 4** |

### three-point.spec.ts (6 tests)
| Test | Depende de | Estado | Issues |
|------|-----------|--------|--------|
| T040 | createProjectViaWizard | 🔴 | **Step 4** |
| T041 | Wizard step 2 | 🟡 | - |
| T042 | Wizard completo | 🔴 | **Step 4** |
| T043 | Wizard step 2 | 🟡 | - |
| T044 | createProjectViaWizard | 🔴 | **Step 4** |
| T045 | createProjectViaWizard | 🔴 | **Step 4** |

## Plan de Fixes

### PASO 1: FIX CRÍTICO — global-setup.ts UI login
**Problema:** `addCookies({ domain: 'localhost' })` no funciona cross-port
**Solución:** Login UI real en browser headless

### PASO 2: Fix project.helper.ts Step 4
- Aumentar timeout de carga de expertos
- Screenshot en fallo
- Selectores más robustos

### PASO 3: Agregar scripts npm
- `e2e:reset-auth` — limpiar estado
- `e2e:fresh` — limpiar y correr

### PASO 4: Verificar vite.config.ts
- Asegurar que el puerto sea 3001

## Commits Planificados
1. `fix(e2e): use UI login in global-setup — fixes SameSite:Lax cookie cross-port block`
2. `fix(e2e): robust Step 4 selectors + screenshot on failure`
3. `feat(e2e): add e2e:reset-auth and e2e:fresh npm scripts`
4. `fix(e2e): add vite port 3001 config`
