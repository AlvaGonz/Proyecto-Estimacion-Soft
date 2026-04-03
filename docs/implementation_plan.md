# Plan de Implementación: De-monolith de App.tsx 🚀

## Contexto
`App.tsx` es actualmente un archivo monolítico de 636 líneas que maneja autenticación, enrutamiento de vistas, diseño (layout), componentes de UI pesados (Sidebar/Header) y lógica de estado del dashboard. Esto dificulta el mantenimiento y la escalabilidad de EstimaPro.

## Objetivos
- Reducir `App.tsx` a menos de 100 líneas.
- Extraer hooks personalizados para lógica de negocio y UI.
- Crear componentes de Layout reutilizables.
- Implementar un sistema de enrutamiento de vistas más limpio.

---

## 🛠️ Fase 1: Extracción de Hooks y Tipos Locales

### 1.1 Crear `src/shared/hooks/useAppState.ts`
Extraer toda la gestión de estado de `App.tsx` (`view`, `projects`, `visibility toggles`, `search`, `selectedProjectId`, `unreadNotifications`, `showProfileModal`).

---

## 🧱 Fase 2: Fragmentación de Componentes de UI

### 2.1 `src/shared/components/layout/Sidebar.tsx`
- Extraer el componente `aside` con todos sus estilos.
- Mover el componente interno `NavButton` a un archivo independiente (`src/shared/components/navigation/NavButton.tsx`).

### 2.2 `src/shared/components/layout/Header.tsx`
- Extraer el componente `header`.

### 2.3 `src/shared/components/profile/ProfileModal.tsx`
- Extraer la lógica y el componente del modal de perfil.

### 2.4 `src/shared/components/auth/AuthGate.tsx`
- Componente "Guard" que decide si mostrar `Login`/`Register` o el `AppShell` basado en `currentUser`.

---

## 🚦 Fase 3: Enrutamiento y Orquestación

### 3.1 `src/AppRouter.tsx`
- Componente que maneja el bloque `switch/conditional rendering` de las vistas y los `Suspense`.

### 3.2 Refactorización Final de `src/App.tsx`
- Ensamblar las piezas: `AppWrapper` -> `AuthGate` -> `AppShell` -> `AppRouter`.

---

## 🧪 Verificación y QA

- [ ] Verificar que el Login/Logout sigue funcionando correctamente.
- [ ] Asegurar que la navegación entre Dashboard, Proyectos y Reportes no se rompa.
- [ ] Validar que las notificaciones sigan mostrando el contador correcto.
- [ ] Comprobar que el modo responsive del Sidebar funcione sin fallos.
- [ ] Ejecutar `npm run dev` y revisar la consola en busca de advertencias de React.

---

## 📈 Casos Límite y Riesgos
- **Prop Drilling:** Al separar componentes, asegurar que pasamos las props necesarias o usar Context si la profundidad aumenta.
- **Lazy Loading:** Mantener los `React.lazy` para no impactar el tiempo de carga inicial.
- **Rendimiento:** Asegurar que los efectos de carga de proyectos no se disparen innecesariamente con los nuevos hooks.
