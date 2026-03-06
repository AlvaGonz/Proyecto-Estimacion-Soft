---
description: /consult-brain
---

WORKFLOW: /consult-brain
TRIGGER: Antes de implementar cualquier feature, fix o refactor

CONTEXTO DE LA TAREA: [DESCRIBE TU TAREA AQUÍ]

Ejecuta usando notebooklm-mcp-server:

PASO 1 → notebook_list: Localiza "DelphiEstimator Pro — Project Brain"
PASO 2 → Revisa las fuentes del notebook y responde:

PREGUNTA 1: ¿Existe algún ADR (Fuente 4) que restrinja o guíe esta tarea?
PREGUNTA 2: ¿Qué archivos del Mapa Crítico (Fuente 3) están involucrados?
PREGUNTA 3: ¿Esta tarea está en el Backlog (Fuente 5)? ¿Cuál es su prioridad?
PREGUNTA 4: ¿Las reglas de dominio (Fuente 2) imponen alguna restricción?

PASO 3 → Consulta el AI-DEV Engineer Book (Fuente 7 si fue añadida):
  - ¿Qué patrón recomienda el libro para este tipo de tarea?
  - ¿Hay una sección de Context Engineering, Prompt Engineering o Evaluation relevante?

PASO 4 → Genera un resumen de 5 líneas con:
  ✅ Qué está permitido hacer
  ❌ Qué está prohibido tocar
  ⚠️ Zonas de riesgo que requieren aprobación
  📁 Archivos que debo @mencionar en el contexto del IDE
  🎯 Recomendación del AI-DEV Book aplicable
