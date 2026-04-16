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
<!-- # PLANNING.md — Enhanced Project Management & Discussion

## Estado: 🟡 EN PLANIFICACIÓN

## Objetivos
1. **Gestión de Facilitador**: Permitir a los Administradores cambiar el facilitador en la configuración del proyecto (ubicado entre el método y el umbral).
2. **Persistencia de Asignaciones**: Asegurar que las asignaciones de facilitadores y expertos se guarden en la DB y se reflejen en la vista del usuario.
3. **Chat de Discusión Anónimo**: Implementar un debate técnico por tarea con persistencia en DB, mostrando solo la clasificación (rol) del usuario.
4. **Logs de Actividad Mejorados**: Expandir el registro de auditoría para incluir el responsable, fecha/hora formateada, y detalles específicos de lo que se gestionó.

## Tareas Identificadas
- [ ] Actualizar modelos `Comment` y `AuditLog`.
- [ ] Crear endpoints de backend para discusiones por tarea.
- [ ] Reposicionar selector de facilitador en `ProjectDetail.tsx`.
- [ ] Implementar lógica de persistencia y roles en `DiscussionSpace.tsx`.
- [ ] Formatear y expandir `ProjectAuditLog.tsx`.

## Decisiones de Diseño
- Usar el campo `userRole` en los comentarios para mantener el anonimato pero proveer contexto.
- Los logs almacenarán el nombre del responsable en el momento de la acción para trazabilidad histórica rápida.

## Preguntas Pendientes
1. ¿La "Clasificación" en el chat debe ser el nombre del rol (ej. "Experto")?
2. ¿Los logs deben guardar el nombre del responsable como texto estático o link dinámico? -->

<!-- ---

# PLANNING.md — Polishing Project Settings, Discussion, and Logs

## Estado: 🟡 EN PLANIFICACIÓN

## Alcance confirmado
1. Permitir que **Administrador** asigne/cambie facilitador en `Project Settings` (entre método y umbral), solo si el proyecto no está finalizado.
2. Persistir correctamente asignación de facilitador/expertos para que aparezca en la pestaña de proyectos de cada usuario.
3. Implementar chat de discusión anónimo por tarea activa de sprint:
   - Participan solo usuarios activos/seleccionados del proyecto (expert/facilitator/administrator).
   - Persistencia en DB por tarea (aislado entre tareas).
   - Mostrar clasificación (`Expert`/`Facilitator`/`Administrator`), mensaje y fecha/hora `dd/mm/YYYY HH:MM:SS`.
4. Ampliar logs de actividad para incluir:
   - Responsable (snapshot histórico: nombre + rol al momento de la acción).
   - Fecha/hora `dd/mm/YYYY HH:MM:SS`.
   - Qué se gestionó (cambio de experto/facilitador/métrica/etc.).
   - Evidencia de cambio de facilitador en log.

## Fases
- [ ] Fase 1 — Diagnóstico de modelos, relaciones y endpoints actuales.
- [ ] Fase 2 — Backend: modelos/controladores/rutas para persistencia de asignaciones, discusión y logs.
- [ ] Fase 3 — Frontend: Project Settings, Discussion tab y Logs tab.
- [ ] Fase 4 — Validación técnica (lint/tests rápidas) y ajustes.
- [ ] Fase 5 — Actualizar plan a completado y preparar resumen final.

## Riesgos y validaciones
- Validar permisos por rol en backend para evitar cambios no autorizados.
- Validar transición por estado de proyecto para bloquear cambios en `Finished`.
- Mantener compatibilidad con datos ya existentes en colecciones actuales. -->