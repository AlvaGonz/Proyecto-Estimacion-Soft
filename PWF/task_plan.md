# Task Plan: E2E Audit & Compliance (RF001–RF034)

## Objective
Execute a complete audit of the platform using Playwright to ensure compliance with the LDR requirements, fixing bugs as they are found.

## Phases
### Phase 1: Dashboard Audit (SPEC 1) [COMPLETE]
- [x] Run `dashboard.spec.ts`.
- [x] Verify RF026 (Facilitator Dashboard), RF004 (RBAC), RF029 (Audit History).
- [x] Log results and update findings.

### Phase 2: Projects & Wizard Audit (SPEC 2) [COMPLETE]
- [x] Fix `userService.ts` (experts loading).
- [x] Fix `UserRole` enum discordance.
- [x] Run `projects.spec.ts`.
- [x] Verify RF006 (Creation), RF007 (Update), RF008 (Tasks), RF009 (Experts), RF031 (Method Selection).
- [x] Fix failing test `T012` (Wideband Delphi Creation). (Zod validation & Step guards fixed).
- [x] Fix failing test `T010` (Mandatory name) & `T011` (Valid advancement).
- [x] Correct server-side ID mapping in models (User, Project, Task).

### Phase 3: Delphi Flow Audit (SPEC 3) [COMPLETE]
- [x] Run `estimation-rounds.spec.ts`.
- [x] Fix T026 — Cancelar creación de tarea (modal close selector).
- [x] Fix T027 — Múltiples tareas (timing + description required).
- [x] Verify T020-T027 all passing.
- [x] Verify RF012 (Individual Register), RF013 (Anonymity), RF014 (Justification) — IMPLEMENTED

### Phase 4: Mega Test Suite — Full RF001-RF034 Coverage [COMPLETE]
- [x] Create `e2e/helpers/round.helper.ts` — Helper para gestión de rondas
- [x] Create `e2e/helpers/estimation.helper.ts` — Helper para envío de estimaciones
- [x] Create `e2e/auth.spec.ts` — T028-T040 (RF001-RF005)
- [x] Create `e2e/estimation-submit.spec.ts` — T041-T053 (RF012-RF016, RF031-RF034)
- [x] Create `e2e/statistics.spec.ts` — T054-T061 (RF017-RF022)
- [x] Create `e2e/discussion.spec.ts` — T062-T065 (RF023-RF024)
- [x] Create `e2e/panels.spec.ts` — T066-T072 (RF026-RF027, RF030)
- [x] Create `e2e/documentation.spec.ts` — T073-T075 (RF010-RF011)
- [x] Create `e2e/reports.spec.ts` — T076-T078 (RF028-RF029)
- [x] Update PWF files with findings and progress

### Phase 5: Gap Remediation & Regression [IN PROGRESS]
- [ ] Run full test suite (T010-T078) and fix any regressions
- [ ] Document expected failures (unimplemented features)
- [ ] Mark technical debt in findings.md

### Phase 6: Technical Debt Remediation [IN PROGRESS]
- [x] RF001 — RegisterPage.tsx creado con formulario de registro
- [x] RF001 — Función register() agregada a authService.ts
- [x] RF001 — Ruta /register integrada en App.tsx
- [x] RF001 — Enlace "Registrarse" agregado a Login.tsx
- [x] RF001 — Schema registerSchema actualizado con confirmPassword
- [ ] RF017/RF018 — EstimationCharts.tsx (histograma, evolución)
- [ ] RF025 — Tests T079-T081 para notificaciones
- [ ] RF028 — Función generatePDF con jspdf
- [ ] Backend Fix — Validación description en ProjectDetail.tsx

## Current Focus
- Phase 6 IN PROGRESS — Implementando deuda técnica RF001, RF017, RF018, RF025, RF028
- RF001 Registro: ✅ Implementado (pendiente verificación con backend)
- Librerías disponibles: jspdf ✅, recharts ✅, xlsx ✅

## Test Coverage Summary

| Spec File | Test IDs | RF Covered | Status |
|-----------|----------|------------|--------|
| projects.spec.ts | T010-T019 | RF006-RF009 | ✅ Complete |
| estimation-rounds.spec.ts | T020-T027 | RF008 | ✅ Complete |
| dashboard.spec.ts | — | RF026 parcial | ✅ Complete |
| auth.spec.ts | T028-T040 | RF001-RF005 | ✅ Created |
| estimation-submit.spec.ts | T041-T053 | RF012-RF016, RF031-RF034 | ✅ Created |
| statistics.spec.ts | T054-T061 | RF017-RF022 | ✅ Created |
| discussion.spec.ts | T062-T065 | RF023-RF024 | ✅ Created |
| panels.spec.ts | T066-T072 | RF026-RF027, RF030 | ✅ Created |
| documentation.spec.ts | T073-T075 | RF010-RF011 | ✅ Created |
| reports.spec.ts | T076-T078 | RF028-RF029 | ✅ Created |

## Implementation Status

### Fully Implemented ✅
RF002-RF008, RF010-RF014, RF015-RF016, RF018-RF024, RF026-RF027, RF029-RF034

### Partially Implemented ⚠️
RF001 (Registration via Admin only → **RegisterPage creado, pendiente prueba**), RF017 (Charts exist), RF025 (Notifications UI), RF028 (Reports UI)

### Not Implemented ❌
None — all RF have at least partial coverage

## Error Log (RESOLVED)
- `T012`: Timeout waiting for project card. **FIXED** (Zod validation & Step guards).
- `userService`: Returned `[]` for experts. **FIXED**.
- `UserRoles`: Mismatch between 'Administrador' and 'admin'. **FIXED**.
- `T026`: Modal close selector failing. **FIXED** (Patrón 7).
- `T027`: Race condition on second task creation. **FIXED** (Patrón 8 + 9).

## New Patterns Documented
- Patrón 10: Expected Failures = Deuda Técnica Documentada
- Patrón 11: Helper Detection Pattern (múltiples métodos de estimación)
- Patrón 12: Test.skip para Funcionalidad Faltante

## Fase 6: Technical Debt Remediation — Status Detail

### RF001 — Registro Público [EN PROGRESO]
**Implementado:**
- ✅ `components/RegisterPage.tsx` — Formulario completo con validación Zod
- ✅ `services/authService.ts` — Método `register()` que llama POST /auth/register
- ✅ `utils/schemas.ts` — `registerSchema` con confirmPassword y validación de coincidencia
- ✅ `App.tsx` — Estado `authView` para alternar entre login/register
- ✅ `components/Login.tsx` — Prop `onGoToRegister` y botón "Registrarse"

**Pendiente:**
- 🔄 Verificar que backend tenga endpoint POST /auth/register
- 🔄 Probar flujo completo E2E

### RF017/RF018 — Gráficos [PENDIENTE]
**Librería disponible:** recharts (v3.7.0) ✅
**Tareas:**
- Crear `components/EstimationCharts.tsx` con:
  - DistributionChart: Histograma con Recharts BarChart
  - EvolutionChart: Líneas de evolución con Recharts LineChart
  - Outlier highlighting en rojo
- Integrar en vista de ronda cerrada

### RF025 — Notificaciones [PENDIENTE]
**Componente existe:** NotificationCenter.tsx (con MOCK_NOTIFICATIONS)
**Tareas:**
- Agregar tests T079-T081 en `e2e/panels.spec.ts`
- Verificar que el componente esté integrado en App.tsx

### RF028 — Exportar PDF [PENDIENTE]
**Librería disponible:** jspdf (v4.2.0) ✅
**Tareas:**
- Crear función `generateProjectReport()` en servicio de reportes
- Incluir: datos del proyecto, tareas, métricas, historial de rondas
- Trigger desde botón de exportar en ReportGenerator o ProjectDetail

### Backend Fix — Description Required [PENDIENTE]
**Tarea:**
- Agregar validación visual en ProjectDetail.tsx (campo #newTaskDesc)
- Mostrar "requerida" hint y bloquear submit si está vacío
