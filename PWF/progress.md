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

## Sesión Technical Debt Finale — 18 Mar 2026 14:00

### Tests habilitados/fijos en esta sesión:
| Test | RF | Descripción | Acción |
|------|----|-------------|--------|
| T002-T003 | RF002 | Fix selectors auth | Cambiado `getByLabel` → `locator('#email')` |
| T028-T031 | RF001 | Habilitar tests registro | Removido `test.skip()` - backend listo |
| T079-T081 | RF025 | Tests notificaciones | Agregados a `panels.spec.ts` |

### Archivos modificados:
- `e2e/auth.spec.ts` — Habilitados T028-T031 (registro backend funcional)
- `e2e/estimapro-flow.spec.ts` — Fix selectores T002-T003
- `e2e/panels.spec.ts` — Agregados T079-T081 (RF025)
- `server/src/middleware/rateLimit.middleware.ts` — Skip rate limiter en test env

---

## Sesión Rate Limiter Fix — 18 Mar 2026 15:00

### Problema identificado:
Los tests de registro (T028-T031) fallaban por rate limiting: "Demasiadas solicitudes desde esta IP"

### Solución aplicada:
Modificado `authRateLimiter` para:
1. Skip completo cuando `NODE_ENV === 'test'`
2. Aumentar límite a 1000 requests en test mode
3. Soporte para variable de entorno `SKIP_RATE_LIMIT=true`

---

## Sesión T029 Fix — 18 Mar 2026 15:30

### Problema identificado:
T029 fallaba porque esperaba error de Zod, pero el navegador mostraba validación HTML5 nativa "Please fill out this field"

### Solución aplicada:
Actualizado test para verificar:
1. Que seguimos en página de registro (form no se envió)
2. Que NO avanzamos al dashboard
3. Aceptar validación HTML5 nativa como comportamiento válido

### Resultado:
✅ Todos los tests de auth.spec.ts pasando (13/13)

---

## Sesión T042 Fix — 18 Mar 2026 15:45

### Problema identificado:
T042 tenía strict mode violation - regex `/1|2|3|5|8|13/i` matcheaba múltiples elementos ("1 Expertos", "1 items", etc.)

### Solución aplicada:
Reemplazado selector ambiguo por detección específica de método:
- `input[type="number"]` para Wideband Delphi
- `button` con texto exacto de cartas Fibonacci para Planning Poker  
- Texto "optimista" para Tres Puntos

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
