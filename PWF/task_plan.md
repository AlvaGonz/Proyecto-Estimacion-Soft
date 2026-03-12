# Plan de Tarea: FIX-UI-010 — Funcionalidad de Creación de Proyecto (Métricas y Expertos)

## Objetivo
Hacer que el flujo de creación de proyectos sea completamente funcional, específicamente en la selección de la unidad de métrica y la asignación de expertos.

## Fases
### Fase 1: Investigación y Análisis [COMPLETO]
- [x] Localizar el componente responsable del formulario de creación de proyectos (`ProjectForm.tsx`).
- [x] Analizar cómo se gestiona el estado de `unit` (horas, puntos, días).
- [x] Investigar la fuente de datos para el listado de expertos (`userService.getAllUsers()`).

### Fase 2: Implementación de Métricas [EN PROGRESO]
- [ ] Mejorar la visualización de los botones de unidad (iconos más descriptivos).
- [ ] Asegurar que la selección se refleje correctamente en el payload final.

### Fase 3: Implementación de Selección de Expertos [EN PROGRESO]
- [ ] Cargar la lista de expertos mediante `userService`.
- [ ] Implementar el estado `expertIds` en `ProjectForm`.
- [ ] Reemplazar el mockup del Step 4 con un selector real.
- [ ] Validar que se seleccione al menos un experto.

### Fase 4: Verificación
- [ ] Realizar una creación de proyecto de prueba.
- [ ] Verificar en la base de datos (o logs) que el proyecto se guarda con la unidad y expertos correctos.

## Error Log
- *Ninguno aún.*
