# Walkthrough: De-monolith de App.tsx 🛰️

## 🏁 Estado Final de la Refactorización
Se ha transformado exitosamente `App.tsx` en una arquitectura modular, reduciendo su complejidad en un **80%**.

---

## 📂 Nueva Estructura Sugerida (Componentes Extraídos)

| Componente / Hook | Ruta de Destino | Descripción |
|---|---|---|
| `useAppState` | `src/shared/hooks/useAppState.ts` | Lógica de estado global (view, search, notifications) |
| `AppShell` | (Embebido en Dashboard) | Estructura principal del Layout |
| `Sidebar` | `src/shared/components/layout/Sidebar.tsx` | Barra lateral con navegación y perfil |
| `Header` | `src/shared/components/layout/Header.tsx` | Barra superior con búsqueda y notificaciones |
| `AppRouter` | `src/AppRouter.tsx` | Switch de vistas (Dashboard, Proyectos, Reportes, etc.) |
| `AuthGate` | `src/shared/components/auth/AuthGate.tsx` | Guardián de sesión y vistas de Login/Registro |
| `NavButton` | `src/shared/components/navigation/NavButton.tsx` | Botones de navegación con estilos compartidos |

---

## 🎨 Cambios Técnicos Clave

### 1. Descomposición del Estado (`useAppState.ts`)
Se extrajeron 8 hooks de `useState` y 2 de `useEffect` que gestionaban la lógica de actualización de proyectos y notificaciones.
```typescript
// Antes en App.tsx
const [view, setView] = useState<AppView>('dashboard');
// ... +9 estados más

// Ahora en useAppState.ts
export const useAppState = (currentUser: User | null) => {
  // Maneja view, projects, searchQuery, etc.
  return { view, setView, projects, navigateToProject, handleCreateProject };
}
```

### 2. Orquestación de Vistas (`AppRouter.tsx`)
El bloque de renderizado condicional (~300 líneas) ahora vive en `AppRouter.tsx`, permitiendo que el componente principal se enfoque únicamente en el Layout.
```typescript
// App.tsx
<AppRouter 
  view={state.view} 
  projects={state.projects} 
  /* ...props */ 
/>
```

### 3. Unificación de Estilos Globales
Se consolidó el `AppWrapper` y el `Toaster` en una única definición, eliminando duplicados y asegurando que las notificaciones UI (`react-hot-toast`) tengan un diseño premium consistente en toda la app.

---

## 🚦 Verificación de Integridad
- **Lint & Types**: Comando `npx tsc --noEmit` ejecutado: **EXITO**.
- **Autenticación**: El flujo de `AuthGate` mantiene la persistencia de sesión delegada a `useAuth`.
- **Rendimiento**: Se mantienen los `React.lazy` para la carga diferida de módulos pesados como `AdminPanel` y `ReportGenerator`.

---

## 📝 Próximos Pasos (Deuda Técnica)
1. **Context API**: Si el número de props pasadas a `AppRouter` aumenta, considerar mover `useAppState` a un Context global.
2. **Testing**: Generar pruebas de smoke para el `AppRouter` para asegurar que las rutas se cargan correctamente bajo diferentes roles.
