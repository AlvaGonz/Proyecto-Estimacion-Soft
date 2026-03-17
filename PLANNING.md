# OVERHAUL-E2E-007: Fix cookie cross-port + audit completo

## Estado: ✅ COMPLETADO

## Problema Raíz
`addCookies({ domain: 'localhost' })` en global-setup no funciona con cross-port:
- Frontend en :3001, Backend en :4000
- Cookie SameSite:Lax bloquea requests cross-port
- Resultado: 401 en API calls → lista de expertos vacía

## Solución Aplicada
Login UI REAL en browser headless:
1. Navegar a localhost:3001
2. Llenar formulario de login
3. Backend setea cookie con Set-Cookie header
4. Browser guarda cookie para localhost (origen :3001)
5. storageState captura cookie EXACTAMENTE como el browser la tiene
6. Tests usan misma cookie → GET /api/users → 200 → expertos cargan ✅

## Commits Realizados
1. `cbbf4a4` fix(e2e): use UI login in global-setup — fixes SameSite:Lax cookie cross-port block
2. `466d414` feat(e2e): add e2e:reset-auth and e2e:fresh npm scripts  
3. `7bea6ce` fix(e2e): robust Step 4 selectors + screenshot on failure

## Cambios en Archivos

### e2e/global-setup.ts
- Login UI real en lugar de addCookies()
- Verificación de servidores antes de empezar
- Helper functions organizadas

### e2e/helpers/project.helper.ts
- Step 4 con screenshot automático en fallo
- Selectores más robustos para expertos
- Mejores mensajes de error

### package.json
- `e2e:reset-auth` — limpiar estado de auth
- `e2e:fresh` — limpiar y correr tests

## Para probar

```bash
# Terminal 1: Backend
cd server && npm run dev

# Terminal 2: Frontend  
npm run dev

# Terminal 3: Tests (primera vez o si hay problemas)
npm run e2e:fresh

# O si ya tienes auth guardado
npm run e2e
```

## Tests: 43 listados correctamente ✅
