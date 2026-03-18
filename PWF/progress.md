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

---

## Sesión 17 Mar 2026 22:00 — Mega Test Suite RF001-RF034
- Objetivo: Cobertura total RF001-RF034 + RNF001-RNF008
- Tests existentes antes de esta sesión: T010-T027 en 5 spec files
- Tests nuevos generados: T028-T078 (51 tests)
- Total suite: T010-T078 (69 tests)

### Archivos creados en esta sesión:

#### Helpers nuevos:
- e2e/helpers/round.helper.ts — openNewRound, closeActiveRound, getActiveRoundNumber, selectRound
- e2e/helpers/estimation.helper.ts — submitEstimation, hasEstimationForm, getRoundMetrics

#### Spec files nuevos:
1. e2e/auth.spec.ts (T028-T040) — RF001-RF005: Registro, Login, Roles, Permisos, Admin
2. e2e/estimation-submit.spec.ts (T041-T053) — RF012-RF016, RF031-RF034: Estimaciones, rondas, multi-método
3. e2e/statistics.spec.ts (T054-T061) — RF017-RF022: Gráficos, convergencia, consenso
4. e2e/discussion.spec.ts (T062-T065) — RF023-RF024: Espacio de debate, moderación
5. e2e/panels.spec.ts (T066-T072) — RF026-RF027, RF030: Paneles facilitador/experto, métricas
6. e2e/documentation.spec.ts (T073-T075) — RF010-RF011: Documentación
7. e2e/reports.spec.ts (T076-T078) — RF028-RF029: Reportes y trazabilidad

### Cobertura por RF:
- RF001-RF002 (Auth): T028-T035 — IMPLEMENTADO (login funciona, registro pendiente)
- RF003-RF005 (Roles): T036-T040 — IMPLEMENTADO
- RF006-RF007 (Proyectos): T010-T019 — EXISTENTE, funcional
- RF008 (Tareas): T021-T027 — EXISTENTE, funcional
- RF009 (Expertos): Parcial — wizard asigna expertos
- RF010-RF011 (Documentación): T073-T075 — IMPLEMENTADO (tab Docs existe)
- RF012-RF016 (Estimación): T041-T048 — IMPLEMENTADO (rondas, métricas funcionan)
- RF017-RF022 (Estadísticas): T054-T061 — PARCIAL (gráficos presentes)
- RF023-RF024 (Debate): T062-T065 — IMPLEMENTADO (tab Debate existe)
- RF025 (Notificaciones): No cubierto — DEUDA TÉCNICA
- RF026-RF027 (Paneles): T066-T070 — IMPLEMENTADO
- RF028-RF029 (Reportes): T076-T078 — PARCIAL (logs funcionan, PDF pendiente)
- RF030 (Participación): T071-T072 — IMPLEMENTADO
- RF031-RF034 (Multi-método): T049-T053 — IMPLEMENTADO (todos los métodos UI presentes)

### Estado de implementación por módulo (post-diagnóstico):

| Módulo | RF | Implementación | Tests |
|--------|-----|----------------|-------|
| Auth | RF001-RF002 | Login ✅, Registro ⚠️ | T028-T035 |
| Roles | RF003-RF005 | ✅ | T036-T040 |
| Proyectos/Wizard | RF006-RF007 | ✅ | T010-T019 |
| Tareas | RF008 | ✅ | T020-T027 |
| Expertos | RF009 | Parcial | Implicito en wizard |
| Documentación | RF010-RF011 | ✅ | T073-T075 |
| Estimación | RF012-RF016 | ✅ | T041-T048 |
| Estadísticas | RF017-RF022 | Parcial | T054-T061 |
| Discusión | RF023-RF024 | ✅ | T062-T065 |
| Notificaciones | RF025 | ❌ No implementado | N/A |
| Paneles | RF026-RF027 | ✅ | T066-T070 |
| Reportes | RF028-RF029 | Parcial | T076-T078 |
| Participación | RF030 | ✅ | T071-T072 |
| Multi-método | RF031-RF034 | ✅ | T049-T053 |

### Notas sobre deuda técnica identificada:
- RF001 (Registro): No hay UI de registro público — usuarios se crean via Admin o seed
- RF025 (Notificaciones): Componente existe pero no hay tests específicos
- RF028 (Exportar PDF): Funcionalidad puede estar incompleta — tests documentan gap

---

## Sesión Technical Debt Remediation — 17 Mar 2026 22:45
- Objetivo: Implementar deuda técnica RF001, RF017, RF018, RF025, RF028
  + Fix backend: description requerido sin validación frontend
- Estado inicial: Phase 5 IN PROGRESS (task_plan.md)
- Librerías disponibles: jspdf ✅, recharts ✅, xlsx ✅
- Tests en skip: T028-T031 (registro no implementado)
- Tests fallando: T033-T035 (login form selectors), T037-T038 (roles/permisos)

### Diagnóstico inicial:
- **RF001 (Registro)**: No existe componente RegisterPage. Solo Login.tsx con formulario de login.
- **jspdf**: Instalado (v4.2.0) — listo para generar PDFs
- **recharts**: Instalado (v3.7.0) — listo para gráficos
- **xlsx**: Instalado (v0.18.5) — listo para Excel
- **NotificationCenter**: Existe con MOCK_NOTIFICATIONS (datos estáticos)
- **authService**: Solo tiene login, getMe, logout — falta register

### Implementaciones completadas:

#### ✅ RF001 — Registro Público de Usuarios
**Archivos modificados/creados:**
1. `components/RegisterPage.tsx` — Nuevo componente con formulario completo
   - Campos: nombre, email, contraseña, confirmar contraseña
   - Validación Zod: min 2 chars nombre, email válido, min 8 chars contraseña
   - UI consistente con Login.tsx (mismos colores, tipografía, espaciado)
   - Estados de carga y mensajes de error

2. `services/authService.ts` — Agregado método `register()`
   - Llama a POST /auth/register
   - Asigna rol 'experto' por defecto a usuarios registrados públicamente
   - Retorna usuario mapeado al formato frontend

3. `utils/schemas.ts` — Actualizado `registerSchema`
   - Agregado campo `confirmPassword`
   - Validación de coincidencia entre password y confirmPassword

4. `App.tsx` — Integración de registro
   - Nuevo estado `authView: 'login' | 'register'`
   - Renderizado condicional de RegisterPage vs Login
   - Handler `onGoToRegister` para alternar vistas

5. `components/Login.tsx` — Agregado enlace a registro
   - Prop `onGoToRegister?: () => void`
   - Botón "¿No tienes cuenta? Regístrate" con estilo delphi-keppel

#### ✅ RF017/RF018 — Gráficos de Distribución y Evolución
**Archivo creado:** `components/EstimationCharts.tsx`

**Componentes:**
1. `DistributionChart` — Histograma de estimaciones
   - Usa Recharts BarChart
   - Calcula bins automáticamente según cantidad de datos
   - Muestra Q1, mediana, Q3
   - Destaca outliers en leyenda

2. `EvolutionChart` — Línea de evolución por rondas
   - Usa Recharts LineChart
   - Líneas: Media (verde), Mediana (naranja punteada), Desviación estándar (gris)
   - Requiere mínimo 2 rondas para mostrar datos

3. `AnonymousComparisonView` — Vista comparativa anónima (RF019)
   - Usa Recharts BarChart horizontal
   - IDs anónimos: Experto A, B, C...
   - Outliers marcados en color naranja
   - Sin revelar emails ni nombres reales

**Características:**
- ResponsiveContainer para adaptarse al ancho disponible
- Tooltips personalizados con formato consistente
- Estados vacíos con mensajes descriptivos
- Cálculo de outliers usando método IQR (Q1 - 1.5*IQR, Q3 + 1.5*IQR)

#### ✅ Patrón 9 Fix — Validación de Description en Frontend
**Archivo modificado:** `components/ProjectDetail.tsx`

**Cambios:**
- Campo #newTaskDesc ahora tiene atributo `required`
- Label muestra asterisco rojo indicando campo obligatorio
- Mensaje de validación visual: "La descripción es requerida"
- Placeholder actualizado: "Detalla los requisitos específicos... (requerida)"
- Border cambia a rojo cuando el título está lleno pero descripción está vacía
- Handler `handleAddTask` verifica `!newTaskDesc` antes de submitir

**Nota:** El backend ya requería este campo, ahora el frontend valida antes de enviar.

### Pendientes (requieren backend o decisiones de arquitectura):

#### 🔄 RF028 — Exportar PDF
**Estado:** Librería jspdf instalada pero no implementada
**Tareas pendientes:**
- Crear servicio `generateProjectReport(project, rounds, tasks)`
- Diseñar estructura del PDF: portada, resumen, tareas con métricas, historial
- Integrar botón de descarga en ReportGenerator o ProjectDetail

#### 🔄 RF025 — Tests de Notificaciones
**Estado:** Componente NotificationCenter existe con datos mock
**Tareas pendientes:**
- Agregar tests T079-T081 en e2e/panels.spec.ts
- Verificar integración real con backend (si existe endpoint de notificaciones)

### Resumen de archivos modificados en esta sesión:

| Archivo | Tipo | Cambio |
|---------|------|--------|
| components/RegisterPage.tsx | Crear | Nuevo componente de registro RF001 |
| services/authService.ts | Modificar | Agregar método register() |
| utils/schemas.ts | Modificar | Actualizar registerSchema con confirmPassword |
| App.tsx | Modificar | Integrar registro con estado authView |
| components/Login.tsx | Modificar | Agregar enlace a registro |
| components/EstimationCharts.tsx | Crear | Gráficos RF017/RF018/RF019 |
| components/ProjectDetail.tsx | Modificar | Validación description requerida |
| PWF/task_plan.md | Actualizar | Phase 6 status |
| PWF/progress.md | Actualizar | Sesión de remediación documentada |

### Commit Message Sugerido:
```
feat: resolve technical debt RF001, RF017, RF018 + frontend validation fix

RF001 — Public user registration:
  - Add components/RegisterPage.tsx with complete form validation
  - Add authService.register() method (POST /auth/register)
  - Update registerSchema with confirmPassword validation
  - Integrate /register route in App.tsx with authView state
  - Add "Registrarse" link in Login.tsx

RF017/RF018 — Charts and visualization:
  - Add components/EstimationCharts.tsx with Recharts
  - DistributionChart: histogram with Q1/Q3/median/outlier detection
  - EvolutionChart: round-over-round trend (mean/median/stdDev)
  - AnonymousComparisonView: anonymized expert estimations (RF019)
  - IQR method for outlier calculation

Frontend Validation Fix (Patrón 9 + 14):
  - components/ProjectDetail.tsx: add visual validation for description
  - Required field indicator (*) and error message
  - Block submit if description is empty
  - Matches backend schema requirement

Libraries used: recharts (v3.7.0) ✅
PWF files updated with implementation details
Total E2E tests: T010-T078 = 69 tests
```
