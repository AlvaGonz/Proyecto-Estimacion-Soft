## Sesión Fix & Implement — 17 Mar 2026 23:30

### Tests fallando clasificados (run inicial):
| Test | Tipo | Descripción del fallo |
|------|------|----------------------|
| T028-T031 | TIPO B (Backend) | Backend no tiene endpoint /auth/register implementado |
| T033 | TIPO A | Selector incorrecto — usando [name="correo"] en lugar de #email |
| T034 | TIPO A | Selector incorrecto — mismo problema que T033 |
| T035 | TIPO A | Strict mode violation con múltiples elementos en OR chain |
| T040 | TIPO A | Mismo problema que T035 — strict mode violation |

### Fixes aplicados en esta sesión:

#### e2e/auth.spec.ts — Selectores corregidos
1. **T033-T034**: Reemplazados selectores `[name="correo"], [name="email"]` por `#email, [name="email"]` y luego simplificado a `#email`
2. **T035**: Simplificado el assertion para evitar strict mode violation — ahora usa verificación secuencial de inputs
3. **T040**: Mismo fix que T035 — verificación directa del input #email

#### Tests en skip documentados:
- **T028-T031** (RF001 — Registro): Skip con nota explicativa
  - Razón: Backend no tiene endpoint `/auth/register` implementado
  - Frontend está completo: RegisterPage.tsx, authService.register(), validación Zod
  - Cuando el backend implemente el endpoint, quitar los `test.skip()`

### Run final auth.spec.ts:
```
4 skipped (T028-T031 — backend pending)
9 passed (T032-T040)
```

### Archivos modificados:
| Archivo | Cambio |
|---------|--------|
| e2e/auth.spec.ts | Fix selectores T033-T040, skip T028-T031 con documentación |

---

## Sesión Implementación Reportes y Notificaciones — 18 Mar 2026 10:55

### RFs Implementados en esta sesión:
| RF | Descripción | Estado |
|----|-------------|--------|
| RF028 | Exportar reporte en PDF | ✅ Implementado (`reportService.ts` + `jspdf`) |
| RF029 | Exportar reporte en EXCEL | ✅ Implementado (`reportService.ts` + `xlsx`) |
| RF030 | Historial de reportes generados | ✅ Implementado (UI de historial con `localStorage`) |
| RF025 | Notificaciones persistentes | ✅ Implementado (UI y service con `notifications_updated` events) |

### Fixes de Deuda Técnica:
1. **reportService.ts**: Creado de cero para soportar exportación binaria (PDF/Excel) con datos reales del proyecto y tareas.
2. **ReportGenerator.tsx**: 
   - Rediseño completo con pestañas "Nuevo Reporte" e "Historial".
   - Integración con `taskService` y `roundService` para obtener data real.
   - Guardado de historial local en `localStorage` (limitado a los últimos 10 reportes).
3. **App.tsx**: Actualizado para pasar la lista de proyectos al componente de reportes.
4. **types.ts**: Actualizado para incluir `estimations` en la interfaz `Round`.

### Verificación E2E:
- [ ] Ejecutar `e2e/reports.spec.ts` para validar el flujo.
- [ ] Ejecutar `e2e/panels.spec.ts` para validar notificaciones (T079-T081).
