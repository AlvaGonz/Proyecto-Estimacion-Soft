# DESIGN.md — Proyecto Estimación Software (Delphi)

> Sistema de diseño del frontend. Este archivo guía a agentes de código (Copilot, Gemini, Claude) para generar UI consistente con el proyecto.

---

## Stack Tecnológico

| Tecnología | Versión / Rol |
|---|---|
| React | UI framework (TSX) |
| TypeScript | Tipado estático |
| Vite | Build tool / dev server |
| Tailwind CSS | Utility-first CSS |
| Playwright | E2E testing |
| Vitest | Unit testing |
| Docker / nginx | Contenedor de producción |

---

## Paleta de Colores — Sistema Delphi

La paleta `delphi` está definida en `tailwind.config.js` y debe usarse **exclusivamente** para colores de marca. Accede siempre vía clases Tailwind.

```js
// tailwind.config.js
colors: {
  delphi: {
    keppel:  '#2BBAA5',  // Primary — teal/turquesa
    celadon: '#93D3AE',  // Secondary / success — verde claro
    vanilla: '#FAECB6',  // Accent / highlight — amarillo suave
    orange:  '#F9A822',  // Warning / CTA secundario
    giants:  '#F96635',  // Error / destructivo — naranja fuerte
  }
}
```

### Uso semántico de los colores

| Token Delphi | Clase Tailwind | Uso |
|---|---|---|
| `keppel` | `bg-delphi-keppel` / `text-delphi-keppel` | Botones primarios, links activos, accent principal |
| `celadon` | `bg-delphi-celadon` | Estados de éxito, badges positivos, indicadores de convergencia |
| `vanilla` | `bg-delphi-vanilla` | Highlights, tooltips, badges informativos, fondos de cards de alerta suave |
| `orange` | `bg-delphi-orange` / `text-delphi-orange` | Advertencias, CTA secundarios, estado "pendiente" |
| `giants` | `bg-delphi-giants` / `text-delphi-giants` | Errores, acciones destructivas, alertas críticas |

**Regla:** Nunca hardcodear hex en componentes. Siempre usar clases Tailwind con prefijo `delphi-`.

---

## Tipografía

El proyecto usa la tipografía del sistema de Tailwind (sin fuente custom cargada). Sin embargo, se aplican estas convenciones:

| Elemento | Clases Tailwind |
|---|---|
| Título de página (h1) | `text-2xl font-bold text-gray-800` |
| Subtítulo / sección (h2) | `text-xl font-semibold text-gray-700` |
| Encabezado de card (h3) | `text-lg font-semibold text-gray-700` |
| Cuerpo de texto | `text-sm text-gray-600` |
| Label de formulario | `text-sm font-medium text-gray-700` |
| Texto de ayuda / muted | `text-xs text-gray-400` |
| Texto sobre fondo oscuro | `text-white` o `text-gray-100` |

---

## Espaciado

Usa el sistema de 4px de Tailwind. Nunca valores arbitrarios.

| Uso | Clases |
|---|---|
| Padding interno de card | `p-4` o `p-6` |
| Gap entre cards en grid | `gap-4` o `gap-6` |
| Margin entre secciones | `mb-6` o `mb-8` |
| Padding de botón | `px-4 py-2` |
| Padding de input | `px-3 py-2` |

---

## Componentes Base

### Botón Primario
```tsx
<button className="bg-delphi-keppel hover:bg-opacity-90 text-white font-medium px-4 py-2 rounded-lg transition-colors">
  Acción
</button>
```

### Botón Secundario / Outline
```tsx
<button className="border border-delphi-keppel text-delphi-keppel hover:bg-delphi-keppel hover:text-white font-medium px-4 py-2 rounded-lg transition-colors">
  Cancelar
</button>
```

### Botón Destructivo
```tsx
<button className="bg-delphi-giants hover:bg-opacity-90 text-white font-medium px-4 py-2 rounded-lg transition-colors">
  Eliminar
</button>
```

### Card Base
```tsx
<div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
  {/* contenido */}
</div>
```
- **Nunca** usar `border-l-4 border-delphi-keppel` — es anti-patrón. Usa shadow o fondo alternativo para énfasis.
- Cards activos/seleccionados: `border-delphi-keppel bg-delphi-vanilla/10`

### Input de Formulario
```tsx
<div className="flex flex-col gap-1">
  <label className="text-sm font-medium text-gray-700">Nombre</label>
  <input
    className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-delphi-keppel"
    placeholder="Escribe aquí..."
  />
</div>
```

### Badge de Estado
```tsx
// Convergencia alcanzada
<span className="bg-delphi-celadon text-green-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
  Convergido
</span>

// Pendiente
<span className="bg-delphi-vanilla text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
  Pendiente
</span>

// Error
<span className="bg-delphi-giants/20 text-delphi-giants text-xs font-medium px-2.5 py-0.5 rounded-full">
  Sin consenso
</span>
```

---

## Layout y Estructura de Páginas

El proyecto usa **feature-based routing** con `App.tsx` como enrutador central.

### Layout Base
```tsx
<div className="min-h-screen bg-gray-50">
  {/* Sidebar o Header */}
  <nav className="bg-delphi-keppel text-white">...</nav>

  {/* Área de contenido */}
  <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {/* Page content */}
  </main>
</div>
```

### Grid de Cards (módulos como Projects, Tasks)
```tsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => <Card key={item.id} {...item} />)}
</div>
```

### Vista de Estimación (pantalla principal)
- Usa **layout de dos columnas**: lista de tareas a la izquierda, panel de estimación/votación a la derecha.
- En mobile: colapsa a single-column con pestañas.

---

## Módulos / Features del Sistema

Cada feature vive en `src/features/{nombre}/` y corresponde a una vista o flujo de la aplicación.

| Feature | Descripción |
|---|---|
| `auth` | Login / autenticación de usuarios |
| `projects` | Gestión de proyectos de estimación |
| `tasks` | Historias de usuario o tareas a estimar |
| `estimations` | Proceso de estimación individual (votos) |
| `rounds` | Rondas de estimación (Planning Poker style) |
| `convergence` | Detección de consenso entre estimadores |
| `discussion` | Discusión por tarea entre participantes |
| `reports` | Reportes de resultados y métricas |
| `audit-log` | Registro de auditoría de acciones |
| `notifications` | Sistema de notificaciones en tiempo real |
| `users` | Gestión de usuarios del equipo |

---

## Convenciones de Componentes

- **Archivos:** PascalCase (`EstimationCard.tsx`, `RoundPanel.tsx`)
- **Props tipadas:** Siempre definir `interface Props` o `type Props` antes del componente
- **Estado local:** `useState` para estado de UI; extraer lógica a hooks (`useEstimation.ts`)
- **Shared components:** Viven en `src/shared/` — usar antes de crear uno nuevo en una feature
- **No estilos inline:** Todo via clases Tailwind; si se repite, extraer a componente

---

## Estados de UI Obligatorios

Siempre diseñar y codificar estos estados por cada vista de datos:

| Estado | Patrón |
|---|---|
| **Loading** | Skeleton con `animate-pulse bg-gray-200 rounded` |
| **Empty** | Mensaje descriptivo + botón de acción (nunca solo "Sin datos") |
| **Error** | Banner con `bg-delphi-giants/10 border-delphi-giants text-delphi-giants` + botón Reintentar |
| **Éxito** | Toast o badge con `bg-delphi-celadon` |

---

## Accesibilidad

- Todo botón sin texto visible necesita `aria-label`
- Inputs siempre asociados a `<label>` con `htmlFor`
- Foco visible: el `focus:ring-2 focus:ring-delphi-keppel` es el estándar del proyecto
- Contraste: `delphi-keppel` (#2BBAA5) sobre blanco pasa WCAG AA en texto grande; usar `font-semibold` o `font-bold` en texto pequeño sobre este color