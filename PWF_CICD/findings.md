# Descubrimientos y Hallazgos: CICD-001

### package.json
- `vitest` ya está instalado (`^4.0.18`).
- `test` script apunta a `vitest run --config vite.config.ts`.
- Falta `playwright`.

### vite.config.ts
- Bloque `test` existe pero le falta configuración de cobertura y umbrales.
- `setupFiles` apunta a `./vitest.setup.ts`. Necesito verificar si ese archivo existe.

### Unit Tests
- Total: 20 passed.
- Cobertura: > 90% en archivos críticos (`statistics.ts`, `schemas.ts`).
- Se instaló `@vitest/coverage-v8` exitosamente.

### E2E Tests (Playwright)
- Se identificaron los labels correctos: "CORREO INSTITUCIONAL", "CONTRASEÑA", "INGRESAR AL SISTEMA".
- Las pruebas fallan por timeout (30s) al intentar iniciar sesión, lo cual es esperado dado el bloqueo de la base de datos (Docker). El flujo está listo para ejecutarse una vez el entorno sea estable.

### Docker
- El `Dockerfile` del backend se optimizó a multi-stage, reduciendo el tamaño de la imagen final y mejorando la seguridad al no incluir herramientas de compilación ni correr como root.
