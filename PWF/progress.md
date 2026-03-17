## Sesión 17 Mar 2026 — T035 RESUELTO
- T032: ✅ RESUELTO (nav anchor + exact:true)
- T035: ✅ RESUELTO (stat-card filter + delta relative)
  - Bug A: strict mode — fix: filter({ has: getByText('Proyectos', { exact: true }) })
  - Bug B: frágil increment — fix: delta relativo (beforeCount + 1)
- T036-T041: ✅ Sin regresión
