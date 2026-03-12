## Hallazgos de Implementación (FIX-UI-010)

### ProjectForm.tsx
- [x] El estado de la unidad (`unit`) ahora usa iconos descriptivos (`Clock`, `BarChart3`, `Users`).
- [x] Se añadió la carga real de expertos desde `userService.getAllUsers()` cuando se llega al paso 4.
- [x] Se implementó el estado `expertIds` y el filtro para mostrar solo usuarios con el rol `EXPERT`.
- [x] Se agregó un bloqueador visual (disabled) en el botón "Finalizar" si no hay expertos seleccionados.
- [x] La UI del paso 4 ahora es una cuadrícula scrollable con checkboxes visuales (Check icon).

### userService.ts
- [x] `getAllUsers()` funciona perfectamente como fuente de verdad para el panel de expertos.

### App.tsx
- [x] `handleCreateProject` ya está preparado para recibir el objeto `Project` con los `expertIds` actualizados.
