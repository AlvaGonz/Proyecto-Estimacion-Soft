# OVERHAUL-E2E-007: Fix cookie cross-port + audit completo

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

## Commits
- cbbf4a4 fix(e2e): use UI login in global-setup
- (próximo) feat(e2e): add e2e:reset-auth and e2e:fresh scripts

## Scripts npm
- `npm run e2e` — correr tests
- `npm run e2e:fresh` — limpiar auth y correr
- `npm run e2e:reset-auth` — limpiar estado de auth
