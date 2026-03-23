# REFINAMIENTO DE LÓGICA DE ESTIMACIÓN Y NOTIFICACIONES

## 🎯 OBJETIVOS
1. **F1: Cálculo de Progreso Real**: Implementar una lógica de cálculo de porcentaje de progreso basada en el estado de la tarea y el avance de las rondas.
2. **F2: Resultados de Ronda Inline**: Asegurar que los resultados se muestren debajo de la interfaz desde la primera estimación (no en modal).
3. **F3: Doble Confirmación**: Implementar/Verificar el modal de doble confirmación al cerrar rondas con expertos faltantes.
4. **F4: Notificaciones Robustas**: Corregir recordatorios (IDs poblados) y lógica del punto rojo (facilitador no se auto-notifica).
5. **F5: Corregir Flickering**: Optimizar estados de carga y efectos para evitar saltos visuales.
6. **F6: Métricas sin Overflow**: Ajustar CSS en tablas de métricas para evitar desbordamientos.

## 🗂️ ARCHIVOS AFECTADOS
| Archivo | Acción | Motivo |
|---------|--------|--------|
| `components/EstimationRounds.tsx` | Modificar | Lógica de cierre, reminders, resultados inline y overflow. |
| `components/ProjectDetail.tsx` | Modificar | Cálculo de barra de progreso por tarea. |
| `components/NotificationCenter.tsx` | Modificar | Filtrado de notificaciones por usuario. |
| `App.tsx` | Modificar | Lógica de punto rojo y evitar auto-notificación del facilitador. |
| `types.ts` | Revisar | Asegurar consistencia de tipos (User vs string en expertIds). |
| `services/roundService.ts` | Revisar | Asegurar que el cierre de ronda devuelve los datos necesarios. |

## 🛠️ PLAN DE IMPLEMENTACIÓN

### Fase 1: Estabilidad UI y Barra de Progreso (`ProjectDetail.tsx`)
- Implementar la lógica de progreso:
  - `PENDIENTE`: 0%
  - `ESTIMANDO`: `((ronda_actual - 1) / max_rondas * 100) + (estimaciones_ronda_actual / total_expertos / max_rondas * 100)`
  - `CONSENSUADA/FINALIZADA`: 100%

### Fase 2: Lógica de Rondas y Reminders (`EstimationRounds.tsx`)
- Corregir `handleSendReminder`: Manejar `expertIds` como objetos poblados.
- Corregir `handleCloseRound`:
  - Si faltan expertos, activar `showCloseConfirmModal`.
  - Asegurar que el cierre proceda tras confirmación.
- Resultados Inline: Verificar que el componente de resultados se renderice condicionalmente basado en si hay estimaciones (incluso si la ronda está abierta, pero anonimizado).

### Fase 3: Notificaciones y Seguridad (`App.tsx` & `NotificationCenter.tsx`)
- Cambiar imports dinámicos a estáticos para `notificationService` en `App.tsx`.
- En `handleCreateProject`, evitar añadir notificaciones si el `expertId` es el mismo que `currentUser.id`.
- Asegurar que el punto rojo refleje solo las no leídas del usuario actual.

### Fase 4: Pulido Visual
- Ajustar `min-w-0`, `truncate` y `flex-shrink` en las tablas de métricas de `EstimationRounds.tsx`.
- Revisar `loadRounds` para asegurar que el `isLoading` solo se active en acciones de usuario, no en el poll.

## 🧪 CASOS DE PRUEBA
1. **Progreso**: Crear tarea -> 0%. Un experto estima -> % parcial. Cerrar ronda -> % aumenta. Consenso -> 100%.
2. **Reminders**: Facilitador envía recordatorio -> Solo expertos faltantes reciben notificación.
3. **Cierre**: Intentar cerrar ronda sin todos los votos -> Modal de confirmación -> Confirmar -> Ronda cerrada.
4. **Notificaciones**: Facilitador crea proyecto -> Expertos ven punto rojo. Facilitador NO ve notificación de su propia acción.
