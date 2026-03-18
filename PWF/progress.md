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
