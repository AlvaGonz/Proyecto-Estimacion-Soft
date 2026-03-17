# Hallazgos E2E — EstimaPro Dashboard

## Patrón 1: Nav Sidebar Anchor (T032)
getByRole('button', { name: /dashboard/i }) es AMBIGUO cuando proyectos
tienen "Dashboard" en el nombre. SIEMPRE anclar: page.locator('nav').first()
.getByRole('button', { name: 'Dashboard', exact: true })

## Patrón 2: Stat Card Locator (T035)
getByText('Proyectos') matchea 3 elementos. SIEMPRE:
page.locator('div').filter({ has: getByText('Proyectos', { exact: true }) })
.filter({ has: page.locator('text=/^\\d+$/') }).first()

## Patrón 3: Counter Delta (T035)
NUNCA verificar contadores absolutos. SIEMPRE:
const before = parseInt(await countEl.textContent()); 
// ... action ...
expect(parseInt(await countEl.textContent())).toBe(before + 1);

## Patrón 4: Test de Nomenclatura (T032 origen)
Los proyectos E2E creados con timestamp en el nombre (ej: 'Dashboard Stats 173...')
contaminan selectores que buscan palabras del nombre ('dashboard').
Mitigación: en futuros tests considerar prefijo neutro ej: 'E2E-Proj-{timestamp}'

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
