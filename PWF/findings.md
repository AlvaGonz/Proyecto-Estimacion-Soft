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
  - h3 en el panel de detalle (task detail view)
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
