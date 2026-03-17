# OVERHAUL-E2E-001: Playwright Full Overhaul

## Objetivo
Eliminar `webServer` de playwright.config.ts y hacer que los servidores se levanten manualmente antes de correr E2E. Esto evita el timeout de 60s esperando que el backend compile.

## Pasos

### PASO 1 — Eliminar webServer del config ✅
- [x] Reemplazar playwright.config.ts completo
- [x] Agregar storageState condicional
- [x] Agregar ESM __dirname fix

### PASO 2 — Agregar scripts e2e al package.json ✅
- [x] e2e:check - verifica servidores
- [x] e2e:safe - verifica y corre tests
- [x] e2e:headed, e2e:debug

### PASO 3 — Crear e2e/check-servers.ts ✅
- [x] Verificar frontend (:5173) y backend (:4000) respondan

### PASO 4 — Corregir e2e/global-setup.ts ✅
- [x] ESM __dirname compatible
- [x] Backend ping check antes de login
- [x] Manejo de errores robusto

### PASO 5 — Actualizar README.md ✅
- [x] Instrucciones claras de E2E setup

## Archivos a modificar
1. playwright.config.ts
2. package.json (root)
3. e2e/check-servers.ts (nuevo)
4. e2e/global-setup.ts
5. README.md

## Commits planeados
1. `fix(e2e): remove webServer — assume servers running before npm run e2e`
2. `feat(e2e): add check-servers pre-flight script + e2e:safe npm script`
3. `fix(e2e): robust global-setup — ESM dirname, backend ping check`
4. `docs: add E2E setup instructions to README`
