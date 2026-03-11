# PLANNING.md — QA-DEBUG-001: Smoke Test + Bug Fix Wideband Delphi Flow
> Skill principal: @.antigravity/skills/planning-with-files/SKILL.md
> Skill de exploración: @.antigravity/skills/playwright-explore-website/SKILL.md
> Skill de documentación: @.antigravity/skills/documentation-writer/SKILL.md
> Skill de review: @.antigravity/skills/review-and-refactor/SKILL.md
> Branch: feature/RF031-RF032-RF034-estimation-methods-ui
> Actualiza ✅/🚧/❌ en tiempo real. Registra CADA hallazgo en la sección BUGS.

## Archivos de contexto — LEER TODOS antes de cualquier acción
- [App.tsx](file:///c:/Users/Admin/Desktop/Proyecto-Estimacion-Soft/App.tsx)
- [ProjectForm.tsx](file:///c:/Users/Admin/Desktop/Proyecto-Estimacion-Soft/components/ProjectForm.tsx)
- [EstimationRounds.tsx](file:///c:/Users/Admin/Desktop/Proyecto-Estimacion-Soft/components/EstimationRounds.tsx)
- [ProjectDetail.tsx](file:///c:/Users/Admin/Desktop/Proyecto-Estimacion-Soft/components/ProjectDetail.tsx)
- [roundService.ts](file:///c:/Users/Admin/Desktop/Proyecto-Estimacion-Soft/services/roundService.ts)
- [estimationService.ts](file:///c:/Users/Admin/Desktop/Proyecto-Estimacion-Soft/services/estimationService.ts)
- [projectService.ts](file:///c:/Users/Admin/Desktop/Proyecto-Estimacion-Soft/services/projectService.ts)
- [authService.ts](file:///c:/Users/Admin/Desktop/Proyecto-Estimacion-Soft/services/authService.ts)
- [api.ts](file:///c:/Users/Admin/Desktop/Proyecto-Estimacion-Soft/utils/api.ts)

---

## FASE 1 — SMOKE TEST: Recorrer el flujo completo manualmente
✅ **F1: Estabilidad de Carga**
   - El dashboard carga sin bucles de recarga infinitos.
   - Vite HMR funciona correctamente en el puerto 3001.

✅ **F2: Login y Autenticación**
   - Credenciales válidas permiten ingresar.
   - Logout redirige correctamente al login.

✅ **F3: Perfil de Usuario**
   - El botón "Perfil" abre un modal con datos reales del usuario.

### Flujo Happy Path — Wideband Delphi (documentar CADA pantalla)

Recorre este flujo exacto y registra en la sección BUGS todo lo que falle, 
se vea extraño, o no funcione:

**F1 — Login**
- [ ] Ir a http://localhost:5173 🚧
- [ ] Iniciar sesión como Facilitador (credenciales del seed) 🚧
  - Registrar: ¿Aparece pantalla de login? ¿Funciona el formulario?
  - Bug?: Redirige correctamente al dashboard?

**F2 — Dashboard**
- [ ] Verificar que carga sin errores de consola 🚧
- [ ] Verificar que el contador "Proyectos" muestra el número correcto (no hardcoded) 🚧
- [ ] Hacer clic en botón "Perfil" (sidebar) — ¿hace algo? 🚧
- [ ] Escribir en el buscador — ¿filtra algo? 🚧
- [ ] Registrar en BUGS: cualquier `console.error` visible en DevTools (F12) 🚧

**F3 — Crear Proyecto con método Wideband Delphi**
- [ ] Clic "Nueva Sesión" → va a `ProjectForm` 🚧
- [ ] Step 1: Rellenar nombre="Test Delphi QA" desc="Proyecto de prueba QA automatizado" 🚧
  - Bug?: ¿Validación Zod funciona (dejar campo vacío y avanzar)?
- [ ] Step 2 (nuevo): Seleccionar "Wideband Delphi" 🚧
  - Bug?: ¿El selector existe? ¿Se puede seleccionar?
  - Bug?: ¿ las 3 cards aparecen correctamente?
- [ ] Step 3: Seleccionar unidad "Horas" 🚧
- [ ] Step 4: Finalizar → ¿crea el proyecto y navega a lista? 🚧
  - Bug?: ¿El proyecto nuevo aparece en la lista inmediatamente?
  - Bug?: ¿`estimationMethod` se guarda correctamente en el objeto del proyecto?

**F4 — Abrir Proyecto → Crear Tarea**
- [ ] Clic en el proyecto creado → ProjectDetail 🚧
  - Bug?: ¿Carga el detalle del proyecto?
- [ ] Crear una tarea: título="Módulo de autenticación" desc="Implementar JWT" 🚧
  - Bug?: ¿El botón "Agregar tarea" funciona?
  - Bug?: ¿La tarea aparece en la lista?

**F5 — Iniciar Ronda de Estimación (CORE del flujo)**
- [ ] En la tarea creada, hacer clic en "Estimar" o botón equivalente 🚧
  - Bug?: ¿Navega a EstimationRounds?
  - Bug?: ¿El método del proyecto aparece en el header de la ronda? ("Método: Wideband Delphi")
- [ ] Abrir primera ronda (R1) 🚧
  - Bug?: ¿El botón "+" funciona y llama a `roundService.openRound`?
  - Bug?: ¿Aparece el `DelphiInput` correctamente (campo numérico + unidad + justificación)?
- [ ] Enviar estimación: valor=8, justificación="Complejidad media por integración OAuth" 🚧
  - Bug?: ¿El botón "Enviar Estimación" se habilita al cumplir los requisitos (valor>0, justificación≥10 chars)?
  - Bug?: ¿La estimación aparece en la lista del panel izquierdo?
- [ ] Enviar segunda estimación (simular segundo experto o con otro usuario) 🚧
- [ ] Clic "Analizar Ronda" (botón que cierra ronda) 🚧
  - Bug?: ¿Llama a `roundService.closeRound`? Verificar en Network tab (F12)
  - Bug?: ¿Aparece el panel de AI Insights?
  - Bug?: ¿El badge de convergencia tiene nivel y color correcto?

**F6 — Segunda ronda (si la convergencia no fue Alta)**
- [ ] Clic "Nueva Ronda" → R2 se abre 🚧
  - Bug?: ¿El historial muestra R1 cerrada y R2 activa?
- [ ] Enviar estimaciones y cerrar ronda 🚧
- [ ] ¿El gráfico de Evolución (toggle History) muestra ambas rondas? 🚧

**F7 — Finalizar tarea**
- [ ] Si convergencia = Alta, aparece botón "Finalizar Tarea" 🚧
  - Bug?: ¿El botón funciona? ¿La tarea pasa a estado "Consensuada"?
  - Bug?: ¿El valor final se guarda en la tarea?

---

## FASE 2 — REGISTRO DE BUGS

Completar esta tabla por cada problema encontrado en la Fase 1.
Ser ESPECÍFICO: archivo, línea aproximada, comportamiento esperado vs. real.

## BUGS ENCONTRADOS — QA-DEBUG-001

| ID | Severidad | Archivo | Descripción | Comportamiento Esperado | Comportamiento Real |
|----|-----------|---------|-------------|------------------------|---------------------|
| BUG-001 | Alta | App.tsx:~L192 | Botón "Perfil" sin handler | Navegar a perfil de usuario | No hace nada |
| BUG-002 | Media | App.tsx:~L213 | Search input sin filtrado | Filtrar proyectos en tiempo real | No filtra |
| BUG-003 | Baja | App.tsx dashboard | Stat "Rondas: 04" hardcoded | Mostrar rondas reales del usuario | Muestra "04" siempre |

---

## FASE 3 — DEBUGGING (ejecutar DESPUÉS de completar FASE 2)

### FASE 3 — REFACTORES RÁPIDOS (Quick Wins)
✅ **FIX-001: Modal de Perfil** -> Implementado en App.tsx.
✅ **FIX-002: Filtro de Búsqueda** -> Barra de búsqueda funcional en Header.
✅ **FIX-003: Stats Dinámicos** -> Las cards del dashboard usan counts reales de Proyectos.
🚧 **FIX-004: Auditoría Mock** -> Pendiente.
FIX-003: Stats hardcoded en dashboard — App.tsx** 🚧
**FIX-004: Auditoría hardcoded en dashboard — App.tsx** 🚧
**FIX-005: Verificar que el flujo de ronda realmente funciona con backend** 🚧

---

## FASE 4 — DOCUMENTAR HALLAZGOS (ejecutar después de fixes)

Crear el archivo `docs/QA-SMOKE-TEST-001.md`.

---

## FASE 5 — COMMITS Y CIERRE
🚧 Pendiente
