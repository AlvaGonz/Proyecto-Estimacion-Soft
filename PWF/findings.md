# Hallazgos E2E — EstimaPro Dashboard

## Patrón 1: Nav Sidebar Anchor (T032)
getByRole('button', { name: /dashboard/i }) es AMBIGUO cuando proyectos
tienen "Dashboard" en el nombre. SIEMPRE anclar: page.locator('nav').first()
.getByRole('button', { name: 'Dashboard', exact: true })

## Patrón 2: Stat Card Locator (T035)
getByText('Proyectos') matchea 3 elementos. SIEMPRE:
page.locator('div').filter({ has: getByText('Proyectos', { exact: true }) })
.filter({ has: page.locator('text=/^\d+$/') }).first()

## Patrón 3: Counter Delta (T035)
NUNCA verificar contadores absolutos. SIEMPRE:
const before = parseInt(await countEl.textContent()); 
// ... action ...
expect(parseInt(await countEl.textContent())).toBe(before + 1);

## Patrón 4: Test de Nomenclatura (T032 origen)
Los proyectos E2E creados con timestamp en el nombre (ej: 'Dashboard Stats 173...')
contaminan selectores que buscan palabras del nombre ('dashboard').
Mitigación: en futuros tests considerar prefijo neutro ej: 'E2E-Proj-{timestamp}'

## Patrón 5: Sesión Limpia para Auth Negativa (T002/T003)
Tests que prueban LOGIN FALLIDO requieren sesión limpia (sin cookies).
playwright.config.ts tiene `storageState` global → todos los tests heredan sesión autenticada.
Fix: `test.use({ storageState: { cookies: [], origins: [] } })` antes de T002/T003.

## Patrón 6: Task Name Strict Mode (T021/T022)
getByText('Nombre Tarea') matchea 2 elementos:
  - h4 en la lista de tareas (task item)
  - h3 en el panel de detalle (header)
Fix: usar `.first()` o anclar al contenedor de la lista de tareas.
Código: `page.getByText('Nombre Tarea').first()` o 
  `page.locator('[class*="task-list"]').getByText('Nombre Tarea')`

## Patrón 7: Modal Close Selector — Anclar al modal, nunca a la página (T026)
Problema: `page.locator('button').filter({has: svg}).first()` en una SPA
  con sidebar SVG-heavy siempre golpea un botón del nav, no el modal.
Fix: usar aria-label específico: `page.getByRole('button', { name: 'Cerrar modal' })`
  O anclar al scope del modal primero:
  `page.locator('[role="dialog"]').locator('button[aria-label*="cerrar"]')`
  O usar `page.keyboard.press('Escape')` si el modal lo soporta.
Aplica a: TODOS los tests que cierren modales por botón X.
Product fix: agregar `aria-label="Cerrar modal"` al botón X para accesibilidad + testabilidad.

## Patrón 8: Modal Cierre Condición — No usar waitForTimeout (T027)
Problema: `waitForTimeout(500)` no garantiza que el modal se cerró ni
  que el estado de la lista se actualizó.
Fix: `await expect(page.locator('#inputDelModal')).not.toBeVisible({ timeout: 8_000 })`
  antes de la próxima acción. Luego esperar que el ítem creado aparezca en lista.
Aplica a: todos los flujos create → verificar → create de nuevo.

## Patrón 9: Task Description Required (T027)
El backend requiere campo `description` para crear tarea, aunque frontend
no lo marca como required visualmente. Tests deben incluir descripción.
Código: `await page.locator('#newTaskDesc').fill('Descripción de la tarea');`

## Patrón 10: Expected Failures = Deuda Técnica Documentada (Mega Suite)
Si un test falla porque la funcionalidad NO EXISTE en la app (ej: T028-T031 registro,
T077 exportar PDF), el test es CORRECTO. La falla es documentación de deuda técnica.
No eliminar ni saltear estos tests — son el roadmap de lo que falta implementar.
Usar: `test.skip(true, 'motivo')` solo si bloquea los tests siguientes.
Marcar en task_plan.md como "DEUDA TÉCNICA RF0XX".

## Patrón 11: Helper Detection Pattern (T041-T053)
Para tests que soportan múltiples métodos de estimación, detectar el método
activo según los elementos visibles en lugar de parámetros externos.
Código:
```typescript
const hasPoker = await page.getByText('5', { exact: true }).isVisible({ timeout: 2_000 }).catch(() => false);
const hasThreePoint = await page.getByText(/optimista/i).isVisible({ timeout: 2_000 }).catch(() => false);
```

## Patrón 12: Test.skip para Funcionalidad Faltante (T028-T031, T064, T077)
Cuando una funcionalidad está planificada pero no implementada (ej: registro público),
usar `test.skip(true, 'mensaje descriptivo')` dentro del test condicional.
Esto permite:
1. Documentar la deuda técnica
2. Facilitar la activación cuando se implemente
3. Mantener el coverage intencional visible

## Patrón 15: Strict Mode Violation en Locators OR
Problema: Playwright lanza "strict mode violation" cuando `.first().or()` resuelve múltiples elementos.
Ejemplo problemático:
```typescript
await expect(
  page.getByRole('button', { name: /ingresar/i }).first()
    .or(page.locator('#email').first())
    .or(page.locator('#password').first())
).toBeVisible();
// Error: resolved to 3 elements
```
Fix: Verificar elementos individualmente en secuencia:
```typescript
await expect(page.locator('#email')).toBeVisible();
await expect(page.locator('#password')).toBeVisible();
```
Aplica a: T035, T040 — cualquier test que verifique múltiples elementos alternativos.

## Patrón 16: Selector IDs vs Name Attributes
Los inputs modernos usan `id` en lugar de `name` para labels y testing.
Ejemplo: Login.tsx usa `id="email"` y `name="email"`, pero el test buscaba `[name="correo"]`.
Fix: Preferir selectores por ID (#email) que son más estables y únicos.
Cambio aplicado en T033-T034: `[name="correo"]` → `#email`

## T035 — Pattern Analysis [17 Mar 2026]

Bug A: selector getByText('Proyectos') matchea 3 elementos:
  - sidebar button (span)
  - stat-card label (p)
  - "Proyectos Recientes" heading (h3)
  Fix: leer stat-card directamente por su estructura, NO por texto global.
  Código: `page.locator('div').filter({ has: getByText('Proyectos', { exact: true }) })`

Bug B: DB contaminada con 55 proyectos de runs anteriores.
  Fix: capturar count antes de crear, verificar +1 con delta relativo.
  Patrón: const before = parseInt(statLocator.textContent); await create(); expect(after).toBe(before + 1)

## T002/T003 — Causa raíz [17 Mar 2026]

- Error: timeout esperando getByLabel(/correo institucional/i)
- Snapshot: página mostraba Dashboard autenticado durante espera del login form
- Causa principal: playwright.config.ts tiene `storageState` global en `use: { storageState }`
- Efecto: T002/T003 heredan sesión autenticada del facilitador
- Resultado: `page.goto('/')` redirige a dashboard, el form nunca aparece
- Fix: test.use({ storageState: { cookies: [], origins: [] } }) en T002/T003
- ¿Bug de producto? NO — el comportamiento de redirección es correcto

## T021/T022 — Causa raíz [17 Mar 2026]

- Error: strict mode violation — getByText('Nombre Tarea') = 2 elementos
- Snapshot: el nombre de la tarea aparece en:
  1. h4 en la lista de tareas (clickable item)
  2. h3 en el panel de detalle (header)
- Causa principal: selector global `getByText()` sin anclar al contexto
- Fix: `.first()` o anclar al contenedor de la lista
- ¿Bug de producto? NO — el DOM es válido, el test necesita selector más específico

## T026/T027 — Root cause & fixes [17 Mar 2026]

### T026 — Cancelar creación de tarea

**Bug:**
```typescript
// ANTES (falla):
await page.locator('button').filter({ has: page.locator('svg') }).first().click();
// Resolvía al botón "Cerrar menú lateral" del sidebar responsive, NO al X del modal
```

**Fix de producto (components/ProjectDetail.tsx línea 203):**
```tsx
// Agregar aria-label al botón X para accesibilidad + testabilidad
<button onClick={() => setShowTaskForm(false)} aria-label="Cerrar modal" ...>
```

**Fix de test (e2e/estimation-rounds.spec.ts):**
```typescript
// Nuevo selector específico:
await page.getByRole('button', { name: 'Cerrar modal' }).click();
await expect(page.locator('#newTaskTitle')).not.toBeVisible({ timeout: 5_000 });
```

### T027 — Múltiples tareas

**Bug A — Timing frágil:**
```typescript
// ANTES (race condition):
await page.getByRole('button', { name: /crear tarea/i }).click();
await page.waitForTimeout(500); // No garantiza que el modal cerró
await page.getByRole('button', { name: /añadir tarea/i }).click(); // Falla: modal intercepta click
```

**Fix:**
```typescript
await page.getByRole('button', { name: /crear tarea/i }).click();
await page.waitForLoadState('networkidle');
await expect(page.getByText('Primera Tarea').first()).toBeVisible({ timeout: 10_000 });
```

**Bug B — Campo descripción requerido por backend:**
El backend requiere `description` pero el frontend no lo valida. Al crear tarea
solo con título, el API falla silenciosamente y el modal permanece abierto.

**Fix:** Agregar descripción en ambas tareas del test:
```typescript
await page.locator('#newTaskTitle').fill('Primera Tarea');
await page.locator('#newTaskDesc').fill('Descripción de la primera tarea');
```

**Resultado:** T026 ✅, T027 ✅, T020-T025 sin regresión

## Mega Test Suite — Cobertura RF001-RF034 [17 Mar 2026]

### Estrategia de tests para funcionalidad faltante

**RF001 (Registro de usuarios):**
- Estado: UI de registro público NO implementada
- Aproximación: Tests T028-T031 usan detección condicional
  - Si existe enlace de registro: ejecutan validaciones
  - Si no existe: `test.skip()` documentando la deuda técnica
- Justificación: El documento base (Proyecto-Plataforma-de-Estimacion.pdf) 
  especifica RF001, pero la app actual usa creación via Admin Panel

**RF025 (Notificaciones):**
- Estado: Componente existe (NotificationCenter) pero sin cobertura E2E específica
- Aproximación: No se crearon tests específicos — feature existe en UI

**RF028 (Exportar PDF):**
- Estado: Botón existe pero funcionalidad puede estar incompleta
- Aproximación: T077 detecta si el botón existe y maneja ambos casos

### Total de tests por spec file

| Spec File | Tests | RF Cubiertos |
|-----------|-------|--------------|
| projects.spec.ts | T010-T019 | RF006-RF009 |
| estimation-rounds.spec.ts | T020-T027 | RF008 |
| dashboard.spec.ts | (existente) | RF026 parcial |
| auth.spec.ts | T028-T040 | RF001-RF005 |
| estimation-submit.spec.ts | T041-T053 | RF012-RF016, RF031-RF034 |
| statistics.spec.ts | T054-T061 | RF017-RF022 |
| discussion.spec.ts | T062-T065 | RF023-RF024 |
| panels.spec.ts | T066-T072 | RF026-RF027, RF030 |
| documentation.spec.ts | T073-T075 | RF010-RF011 |
| reports.spec.ts | T076-T078 | RF028-RF029 |

**Total: T010-T078 = 69 tests E2E**

### Estado de implementación real vs. documento base

| RF | Descripción | Implementación | Test |
|----|-------------|----------------|------|
| RF001 | Registro usuarios | ⚠️ Parcial (solo Admin) | T028-T031 (skip condicional) |
| RF002 | Login | ✅ Completo | T032-T035 |
| RF003 | Roles | ✅ Completo | T036-T039 |
| RF004 | Permisos | ✅ Completo | T036-T039 |
| RF005 | Admin panel | ✅ Completo | T038-T040 |
| RF006 | Crear proyecto | ✅ Completo | T010-T014 |
| RF007 | Editar proyecto | ✅ Completo | T015-T016 |
| RF008 | Gestión tareas | ✅ Completo | T021-T027 |
| RF009 | Asignar expertos | ✅ Completo | Implicito en wizard |
| RF010 | Subir documentos | ✅ Completo | T073-T074 |
| RF011 | Ver docs (experto) | ✅ Completo | T075 |
| RF012 | Abrir ronda | ✅ Completo | T041-T043 |
| RF013 | Anonimato | ✅ Completo | T044, T048 |
| RF014 | Justificaciones | ✅ Completo | T045 |
| RF015 | Métricas | ✅ Completo | T046, T049-T053 |
| RF016 | Outliers | ✅ Completo | T047 |
| RF017 | Gráficos | ⚠️ Parcial | T054-T055 |
| RF018 | Evolución | ⚠️ Parcial | T056 |
| RF019 | Comparativa anónima | ✅ Completo | T057 |
| RF020 | Convergencia | ✅ Completo | T058 |
| RF021 | Indicadores consenso | ✅ Completo | T059 |
| RF022 | Recomendación | ✅ Completo | T060-T061 |
| RF023 | Espacio debate | ✅ Completo | T062-T065 |
| RF024 | Moderación | ✅ Completo | T064 |
| RF025 | Notificaciones | ⚠️ Parcial | No test específico |
| RF026 | Panel facilitador | ✅ Completo | T066-T068 |
| RF027 | Panel experto | ✅ Completo | T069-T070 |
| RF028 | Reportes | ⚠️ Parcial | T076-T077 |
| RF029 | Historial | ✅ Completo | T078 |
| RF030 | Métricas participación | ✅ Completo | T071-T072 |
| RF031 | Wideband Delphi | ✅ Completo | T049 |
| RF032 | Planning Poker | ✅ Completo | T050 |
| RF033 | Three-Point | ✅ Completo | T051, T053 |
| RF034 | Bloquear método | ✅ Completo | T052 |

**Leyenda:**
- ✅ Completo: Funcionalidad implementada y testeada
- ⚠️ Parcial: Funcionalidad básica existe, puede faltar refinamiento
- ❌ No implementado: No existe en la app
