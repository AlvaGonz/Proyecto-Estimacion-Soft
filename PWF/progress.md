## Sesión 17 Mar 2026
- T032: ✅ RESUELTO (nav anchor + exact:true)
- T035: ✅ RESUELTO (stat-card filter + delta relative)
- T002/T003: ✅ RESUELTO (test.use storageState limpia)
  - Causa: storageState global en playwright.config.ts
  - Fix: test.use({ storageState: { cookies: [], origins: [] } })
  - Archivo: e2e/estimapro-flow.spec.ts
  - Verificado: T001-T007 sin regresión
