# Task Plan — EstimaPro Bug Fixes (Session 2026-03-20)

## Objetivos
1. [X] Resultados de ronda visibles desde la primera estimación (inline, no modal)
2. [ ] Doble confirmación al cerrar ronda con expertos faltantes
3. [ ] Fix notifications / recordatorios (actualmente no funcionan)
4. [ ] Fix flickering de pantalla (re-render pasivo)

## Archivos Clave
- `components/EstimationRounds.tsx` — lógica principal de rondas (~910 líneas)
- `App.tsx` — unreadNotifications useEffect (posible causa de flickering)
- `services/notificationService.ts` — ya revisado
- `components/NotificationCenter.tsx` — ya revisado

## Fases

### Fase 1: Exploración / Root Cause Analysis [in_progress]
- [ ] Leer EstimationRounds.tsx completo para entender cómo se muestran resultados
- [ ] Identificar el re-render que causa flickering
- [ ] Identificar por qué fallan los recordatorios

### Fase 2: Fix — Resultados inline desde 1ª estimación
- Mostrar sección de resultados parciales (lista de estimaciones de la ronda actual)
  debajo de la interfaz de estimación, sin modal, apenas haya ≥1 estimación.
- El facilitador debe verlas; el experto NO debe ver las de otros mientras la ronda está abierta.

### Fase 3: Fix — Doble confirmación al cerrar ronda con expertos faltantes
- Antes de `handleCloseRound`, verificar si falta algún experto.
- Si faltan → mostrar modal de confirmación con conteo.

### Fase 4: Fix — Notifications / recordatorios
- Diagnóstico: el `import()` dinámico de notificationService puede fallar silenciosamente.
- Solución: cambiar a import estático en los archivos que lo necesiten.

### Fase 5: Fix — Flickering
- Causa probable: `useEffect` en App.tsx con `import()` dinámico se re-ejecuta en loop.
- Solución: convertir a import estático + estabilizar dependencias.

## Errores / Hallazgos
(vacío al inicio)
