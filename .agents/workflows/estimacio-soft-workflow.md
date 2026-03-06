---
description: /init-brain
---

WORKFLOW: /init-brain
TRIGGER: Primera vez que configuras el proyecto en NotebookLM

Ejecuta los siguientes pasos usando el MCP notebooklm-mcp-server:

PASO 1 — Verificar si ya existe el notebook:
  → Llama a notebook_list
  → Busca un notebook llamado "DelphiEstimator Pro — Project Brain"
  → Si existe, DETENTE y avísame. No dupliques.

PASO 2 — Crear el notebook principal:
  → Llama a notebook_create con nombre: "DelphiEstimator Pro — Project Brain"

PASO 3 — Añadir Fuente 1 (Stack & Config) via notebook_add_text:
  Título: "FUENTE 1 — Stack y Configuración"
  Contenido:
  - Proyecto: DelphiEstimator Pro (Método Delphi de Estimación de Software)
  - Repo: https://github.com/AlvaGonz/Proyecto-Estimacion-Soft
  - Stack: React 19, Vite 6, TypeScript 5.8, @google/genai ^1.42
  - Librerías: Recharts, jsPDF ^4.2, xlsx, Zod ^4.3, lucide-react, react-error-boundary
  - Sin backend — estado global en App.tsx (cliente puro)
  - Scripts: npm run dev | npm run build | npm run lint (tsc --noEmit)
  - Sin test runner — Vitest pendiente de instalar

PASO 4 — Añadir Fuente 2 (Dominio Delphi) via notebook_add_text:
  Título: "FUENTE 2 — Reglas de Negocio del Dominio Delphi"
  Contenido:
  - Roles: ADMIN | FACILITATOR | EXPERT
  - Ciclo Proyecto: Preparación → Kickoff → Activo → Finalizado
  - Ciclo Tarea: Pendiente → Estimando → Consensuada
  - Ciclo Ronda: Abierta → Cerrada (solo FACILITATOR)
  - Consenso = coefficientOfVariation bajo umbral definido en utils/
  - Estadísticas (mean, stdDev, IQR, outliers) → SOLO en utils/
  - Llamadas Gemini AI → SOLO en services/
  - Toda respuesta Gemini → validar con z.safeParse() antes de tocar estado

PASO 5 — Añadir Fuente 3 (Mapa de Archivos) via notebook_add_text:
  Título: "FUENTE 3 — Mapa de Archivos Críticos"
  Contenido:
  - types.ts → FUENTE DE VERDAD — NO tocar sin aprobación
  - App.tsx → Orquestador de estado global
  - components/EstimationRounds.tsx → Vista crítica de rondas (19KB)
  - components/ReportGenerator.tsx → Exportación PDF/XLSX (15KB)
  - components/ProjectDetail.tsx → Vista de detalle (15KB)
  - components/AdminPanel.tsx → Panel de administración (12KB)
  - services/ → Gemini AI + exportaciones
  - utils/ → Funciones puras y estadísticas
  - vite.config.ts → NO modificar sin justificación

PASO 6 — Añadir Fuente 4 (ADR Log inicial) via notebook_add_text:
  Título: "FUENTE 4 — ADR Log (Architecture Decision Records)"
  Contenido:
  ADR-001 | Sin backend propio | ACTIVO
  Toda la lógica vive en cliente. Gemini es el único servicio externo.
  Consecuencia: No hay auth server-side. Usuarios en estado local/mock.

  ADR-002 | Zod 4 para validar outputs AI | ACTIVO
  Toda respuesta de Gemini se parsea con z.safeParse() antes de tocar estado.
  Consecuencia: Fallos de la AI no crashean el app.

PASO 7 — Añadir Fuente 5 (Backlog) via notebook_add_text:
  Título: "FUENTE 5 — Backlog de Features y Deuda Técnica"
  Contenido:
  F-001 | Exportar reporte PDF | Completado | Alta
  F-002 | Visualización Recharts | En progreso | Alta
  F-003 | Instalar Vitest | Pendiente | URGENTE — deuda técnica
  F-004 | Context API si props > 3 niveles | Pendiente | Media
  F-005 | Auth real (si se añade backend) | Pendiente | Baja

PASO 8 — Añadir URL del repo como fuente via notebook_add_url:
  URL: https://github.com/AlvaGonz/Proyecto-Estimacion-Soft

PASO 9 — Confirmar creación:
  → Llama a notebook_list y muéstrame el notebook creado con todas sus fuentes.
  → Reporta: "✅ Brain inicializado con [N] fuentes listas."
