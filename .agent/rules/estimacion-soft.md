---
trigger: always_on
---

# 🚀 AGENT WORKSPACE RULES — Proyecto: DelphiEstimator Pro
# Repo: AlvaGonz/Proyecto-Estimacion-Soft
# Versión: 1.0 | Stack: React 19 + Vite 6 + TS 5.8 + Gemini AI
# ESTAS REGLAS EXTIENDEN (no reemplazan) las Reglas Globales de AGENT

---

## 1. 🗂️ ARQUITECTURA Y MAPA DE ARCHIVOS CRÍTICOS
Este proyecto NO tiene backend. Toda la lógica de estado reside en el cliente.
Los archivos fuente de verdad son:

| Archivo / Directorio       | Propósito                                                   |
|----------------------------|-------------------------------------------------------------|
| `types.ts`                 | ⚡ FUENTE DE VERDAD de todos los tipos del dominio          |
| `App.tsx`                  | Controlador de estado global y orquestador de vistas        |
| `components/`              | Componentes UI puros (sin lógica de negocio directa)        |
| `services/`                | Servicios externos: llamadas a Gemini AI y exportaciones    |
| `utils/`                   | Funciones puras: cálculos estadísticos (RoundStats, etc.)   |
| `metadata.json`            | Metadatos del proyecto (NO modificar sin justificación)     |
| `vite.config.ts`           | Configuración del bundler — no añadir plugins sin aprobación|

**Regla Crítica:** NUNCA modifiques `types.ts` sin actualizar TODOS los sitios de uso en
`App.tsx`, `components/`, `services/`, y `utils/`. Busca las referencias antes de cambiar.

---

## 2. 🎯 DOMINIO: MÉTODO DELPHI — REGLAS DE NEGOCIO
El AI debe conocer estas invariantes del dominio para no romper la lógica:

- **Roles:** `UserRole.ADMIN` | `UserRole.FACILITATOR` | `UserRole.EXPERT`
  - Solo el FACILITATOR puede abrir/cerrar Rondas (`Round.status`).
  - Solo los EXPERT pueden emitir `Estimation`.
  - El ADMIN gestiona usuarios y proyectos.

- **Ciclo de vida de un Proyecto:**
  `Preparación` → `Kickoff` → `Activo` → `Finalizado`
  NO generes lógica que salte estados fuera de este orden.

- **Ciclo de vida de una Tarea (`Task`):**
  `Pendiente` → `Estimando` → `Consensuada`
  Una tarea solo llega a `Consensuada` cuando el `coefficientOfVariation` de la última ronda
  cumple el umbral de convergencia definido en `utils/`.

- **Estadísticas (`RoundStats`):** Todo cálculo estadístico vive en `utils/`.
  NUNCA pongas lógica de `mean`, `stdDev`, `iqr`, `outliers` dentro de componentes o App.tsx.

- **AI Insights (`ConvergenceAnalysis`):** Las llamadas a Gemini AI viven en `services/`.
  El componente UI solo consume el resultado; NUNCA llama a `@google/genai` directamente.

---

## 3. 🔑 GESTIÓN DE API KEY — REGLA DE SEGURIDAD ABSOLUTA
- La API Key de Google Gemini se carga EXCLUSIVAMENTE desde variables de entorno.
- Acceso correcto: `import.meta.env.VITE_GEMINI_API_KEY`
- El archivo `.env` ya está en `.gitignore`. NUNCA hardcodees la key.
- Si necesitas el cliente Gemini, instáncialo SOLO en `services/geminiService.ts`
  (o el archivo equivalente en `services/`), no en componentes.

---

## 4. 🧩 PATRONES DE COMPONENTES (React 19)
- **Sin `useEffect` para derivar estado.** Usa `useMemo` o estado derivado en render.
- **Componentes funcionales puros** para todo lo que esté en `components/`.
  Reciben props tipadas explícitamente con interfaces (no `React.FC<>`).
- **Estado global en `App.tsx`** via `useState` + prop drilling controlado.
  Si el árbol de props supera 3 niveles, evalúa Context API antes de añadir una librería.
- **`react-error-boundary`** ya está instalado — úsalo para envolver vistas de alto riesgo
  (especialmente las que consumen la AI).
- Prohibido: `any`, `// @ts-ignore`, y aserciones de tipo sin guardia previa.

---

## 5. 📊 LIBRERÍAS INSTALADAS — USO AUTORIZADO
Usa EXCLUSIVAMENTE las librerías presentes en `package.json`. No instales nuevas sin
justificación explícita en el chat.

| Librería           | Uso Autorizado En                                        |
|--------------------|----------------------------------------------------------|
| `recharts ^3.7`    | Visualización de RoundStats y convergencia               |
| `jspdf ^4.2`       | Exportación de reportes de estimación en PDF             |
| `xlsx ^0.18`       | Exportación de datos a hoja de cálculo                   |
| `zod ^4.3`         | Validación de inputs de usuario y respuestas de la AI    |
| `lucide-react`     | Íconos UI — no usar SVGs inline si existe el ícono aquí  |
| `@google/genai`    | Solo en `services/` — NUNCA en componentes               |

---

## 6. 🔬 TYPESAFETY: REGLAS ESPECÍFICAS DEL PROYECTO
- `types.ts` es la fuente de verdad. Todos los tipos se importan desde ahí.
  ```ts
  // ✅ Correcto
  import { Project, Task, Round, UserRole } from '../types';
  // ❌ Incorrecto
  const project: { id: string; name: string } = ...
