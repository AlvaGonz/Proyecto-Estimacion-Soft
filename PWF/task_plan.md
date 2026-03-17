# Plan de Tarea: FIX-UI-010 — Funcionalidad de Creación de Proyecto (Métricas y Expertos)

## Objetivo
Hacer que el flujo de creación de proyectos sea completamente funcional, específicamente en la selección de la unidad de métrica y la asignación de expertos.

## Fases
### Fase 1: Investigación y Análisis [COMPLETO]
- [x] Localizar el componente responsable del formulario de creación de proyectos (`ProjectForm.tsx`).
- [x] Analizar cómo se gestiona el estado de `unit` (horas, puntos, días).
- [x] Investigar la fuente de datos para el listado de expertos (`userService.getAllUsers()`).

### Fase 2: Implementación de Métricas [EN PROGRESO]
- [ ] Mejorar la visualización de los botones de unidad (iconos más descriptivos).
- [ ] Asegurar que la selección se refleje correctamente en el payload final.

### Fase 3: Implementación de Selección de Expertos [EN PROGRESO]
- [ ] Cargar la lista de expertos mediante `userService`.
- [ ] Implementar el estado `expertIds` en `ProjectForm`.
- [ ] Reemplazar el mockup del Step 4 con un selector real.
- [ ] Validar que se seleccione al menos un experto.

### Fase 4: Verificación
- [ ] Realizar una creación de proyecto de prueba.
- [ ] Verificar en la base de datos (o logs) que el proyecto se guarda con la unidad y expertos correctos.

## Error Log
- *Ninguno aún.*
# Plan de Implementación: CICD-001 - GitHub Actions CI/CD + Pruebas

## Objetivo
Configurar el entorno de pruebas unitarias (Vitest) y E2E (Playwright), implementar pruebas para lógica crítica y esquemas, y establecer pipelines de CI/CD robustos en GitHub Actions.

## Fases

### Fase 0: Setup de Git y Rama [COMPLETADO]
- [x] Crear rama `chore/cicd-unit-tests-setup`.
- [x] Verificar estructura existente.

### Fase 1: Configuración de Vitest [COMPLETADO]
- [x] Ajustar `vite.config.ts` para incluir cobertura y configuraciones faltantes.
- [x] Verificar `vitest.setup.ts`.

### Fase 2: Pruebas Unitarias (Statistics & Schemas) [COMPLETADO]
- [x] Implementar `utils/__tests__/statistics.test.ts`.
- [x] Implementar `utils/__tests__/schemas.test.ts`.
- [x] Verificar que pasen localmente (20/20 passed, coverage > 90%).

### Fase 3: Configuración de Playwright (E2E) [COMPLETADO]
- [x] Instalar `@playwright/test`.
- [x] Crear `playwright.config.ts`.
- [x] Crear script `e2e` en `package.json`.

### Fase 4: Pruebas E2E (Delphi Flow) [COMPLETADO]
- [x] Implementar `e2e/delphi-flow.spec.ts`.
- [!] Nota: Las pruebas fallan localmente porque el backend/DB sigue inactivo, pero el código está listo para CI.

### Fase 5: GitHub Actions Pipelines [COMPLETADO]
- [x] Crear `.github/workflows/ci.yml`.
- [x] Crear `.github/workflows/deploy.yml`.
- [x] Crear `.github/workflows/pr-check.yml`.

### Fase 6: Dockerización Backend [COMPLETADO]
- [x] Crear `server/Dockerfile` (Multi-stage).

### Fase 7: Validación y Envío [EN PROGRESO]
- [x] Ejecución final de lint/test/build.
- [ ] Merge a `develop` vía PR.

## Error Log
- *Ninguno aún.*
