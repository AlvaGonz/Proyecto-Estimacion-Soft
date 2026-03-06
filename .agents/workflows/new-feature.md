---
description: /new-feature
---

WORKFLOW: /new-feature
TRIGGER: Cuando vas a implementar una nueva funcionalidad

NOMBRE DE LA FEATURE: [NOMBRE]
DESCRIPCIÓN: [QUÉ DEBE HACER]

=== FASE A: CONSULTA AL CEREBRO ===
Ejecuta /consult-brain internamente con el contexto de esta feature.
Espera el reporte de restricciones antes de continuar.

=== FASE B: GENERACIÓN DE SPEC ===
Con el contexto del brain, genera un SPEC.md con:
1. Objetivo de la feature en 1 oración
2. Archivos impactados (solo los del Mapa Crítico relevantes)
3. Tipos nuevos o modificados en types.ts (si aplica)
4. Schema Zod si hay inputs de usuario o respuestas de AI
5. Diagrama de flujo en Mermaid (máximo 10 nodos)
6. Pasos de implementación numerados y atómicos
7. Criterios de verificación (cómo sé que funcionó)

ESPERA MI APROBACIÓN DEL SPEC ANTES DE CONTINUAR.

=== FASE C: AGENT PROMPT PARA ANTIGRAVITY ===
Una vez aprobado el spec, genera el bloque "Copy/Paste into IDE":

---AGENT PROMPT---
Context: Lee @types.ts @App.tsx @[archivos relevantes del spec]
Objective: [objetivo del spec en 1 oración]
Constraints:
  - NO modifiques types.ts sin confirmar primero
  - NO añadas lógica de negocio en componentes
  - Stats y cálculos SOLO en utils/
  - Llamadas AI SOLO en services/
  - Usa Zod para validar cualquier input o respuesta AI
  - Tipado estricto — cero `any`
Steps:
  1. [Paso 1 del spec]
  2. [Paso 2 del spec]
  3. [...]
Verification: Ejecuta `npm run lint`. Si pasa sin errores, haz git commit con el tag feat([scope]):
---FIN AGENT PROMPT---

=== FASE D: POST-IMPLEMENTACIÓN ===
Después del commit, ejecuta /update-brain automáticamente.
