# PLANNING.md - Fix Round Transition (Wideband Delphi)

El usuario reporta que el cambio entre rondas no funciona en el método Wideband Delphi. Tras el análisis, se identifica que la interfaz muestra las rondas (R1, R2, etc.) como elementos estáticos (`div`) sin interactividad, y la visualización de datos está fija según el estado de la ronda (la abierta o la última cerrada), impidiendo al usuario alternar entre rondas pasadas para ver sus detalles.

## Objetivos
1. Permitir al usuario navegar entre diferentes rondas (R1, R2, ...) haciendo clic en ellas.
2. Asegurar que la tabla de estimaciones, gráficos y el análisis de convergencia se actualicen según la ronda seleccionada.
3. Mantener la reactividad automática al abrir o cerrar una ronda para que el usuario siempre vea el estado más reciente por defecto.

## Mapa de Archivos Afectados
- `components/EstimationRounds.tsx`

## Plan de Acción

### Fase 1: Estado y Navegación
1. Añadir el estado `selectedRoundId` en `EstimationRounds.tsx`.
2. Actualizar el `useEffect` de carga inicial para inicializar `selectedRoundId` con el ID de la ronda activa (si existe) o la última cerrada.
3. Modificar la UI de navegación de rondas (líneas 384-396) para usar elementos `button` con un `onClick` que actualice `selectedRoundId`.
4. Añadir feedback visual (estilo CSS) para indicar claramente qué ronda está seleccionada actualmente.

### Fase 2: Filtrado de Datos y Visualización
1. Refactorizar la lógica de filtrado de estimaciones (`currentRoundEstimations`, línea 310) para usar `selectedRoundId`.
2. Asegurar que `convergenceResult` y `analysis` (líneas 321-335) se calculen basándose en la ronda seleccionada.
3. Actualizar los gráficos (`distributionData`, línea 337) para que reflejen los datos de la ronda seleccionada.

### Fase 3: Reactividad tras Acciones
1. En `handleCloseRound`, actualizar `selectedRoundId` al ID de la ronda recién cerrada.
2. En `handleStartNextRound`, actualizar `selectedRoundId` al ID de la nueva ronda abierta.

## Casos Límite y Consideraciones
- **Sin rondas:** La UI debe seguir mostrando el estado vacío correctamente.
- **Cambio de tarea:** El `selectedRoundId` debe resetearse o actualizarse al cambiar de tarea (el componente ya se remonta o actualiza vía props, el `useEffect` de carga debe manejar esto).
- **Acceso Permitido:** Aunque se vean rondas pasadas, la entrada de datos (formulario de estimación) solo debe mostrarse si la ronda seleccionada es la ACTIVA (`open`) y el usuario es experto.

---
**¿Aprobado para proceder con la implementación?**
