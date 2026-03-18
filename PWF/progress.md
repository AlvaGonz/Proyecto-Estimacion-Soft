## Sesión 17 Mar 2026
- T032: ✅ RESUELTO (nav anchor + exact:true)
- T035: ✅ RESUELTO (stat-card filter + delta relative)
- T002/T003: ✅ RESUELTO (test.use storageState limpia)
- T021/T022: ✅ RESUELTO
  - Causa: strict mode violation — nombre de tarea en 2 elementos (h4 lista + h3 detalle)
  - Fix: .first() en getByText del nombre de tarea
  - Archivo: e2e/estimation-rounds.spec.ts
  - Patrón: Patrón 6 — Task Name Strict Mode
  - Verificado: T020-T025 sin regresión, T026-T027 fallos pre-existentes

## Sesión 17 Mar 2026 (continuación) — T026/T027 DEBUG
- T026: ✅ RESUELTO
  - Root cause: Selector `button:has(svg).first()` resolvía a sidebar nav button ("Cerrar menú lateral")
  - Product fix: Agregar `aria-label="Cerrar modal"` a botón X en ProjectDetail.tsx línea 203
  - Test fix: Usar `getByRole('button', { name: 'Cerrar modal' })`
  - Patrón documentado: Patrón 7 — Modal Close Selector
  
- T027: ✅ RESUELTO
  - Root cause A: `waitForTimeout(500)` no garantizaba cierre de modal (race condition)
  - Root cause B: Backend requiere campo `description` no validado por frontend
  - Fix A: Reemplazar timeout con `waitForLoadState('networkidle')` + `expect().toBeVisible()`
  - Fix B: Agregar `await page.locator('#newTaskDesc').fill(...)` para ambas tareas
  - Patrón documentado: Patrón 8 — Modal Cierre Condición + Patrón 9 — Task Description Required

- Spec estimation-rounds.spec.ts: ✅ COMPLETO (T020-T027 todos pasan)
- No regresión: Verificado T020-T025 siguen pasando

## Archivos modificados
- components/ProjectDetail.tsx — aria-label en botón X (mejora accesibilidad)
- e2e/estimation-rounds.spec.ts — fixes T026 y T027
- PWF/findings.md — agregados patrones 7, 8, 9 y análisis T026/T027
