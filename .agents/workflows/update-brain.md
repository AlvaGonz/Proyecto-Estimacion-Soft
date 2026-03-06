---
description: /update-brain
---

WORKFLOW: /update-brain
TRIGGER: Al finalizar una sesión, después de hacer git commit

RESUMEN DE LO HECHO HOY: [DESCRIBE BREVEMENTE]
ARCHIVOS MODIFICADOS: [LISTA]
DECISIONES TOMADAS: [SI APLICA]
BUGS RESUELTOS: [SI APLICA]

Ejecuta usando notebooklm-mcp-server:

PASO 1 → notebook_list: Localiza "DelphiEstimator Pro — Project Brain"

PASO 2 — Si se tomó una decisión arquitectónica:
  → notebook_add_text con título "ADR-[número] — [Título de la decisión]"
  → Formato: Decisión | Consecuencia | Estado: ACTIVO

PASO 3 — Si se resolvió un bug:
  → notebook_add_text con título "BUG-[número] — [Título]"
  → Formato: Síntoma | Root Cause | Fix | Archivos tocados | Commit hash

PASO 4 — Si cambió un archivo crítico del Mapa:
  → notebook_add_text con título "MAPA UPDATE — [fecha]"
  → Describe el cambio de responsabilidad del archivo

PASO 5 — Actualizar Backlog (Fuente 5):
  → notebook_add_text con título "BACKLOG UPDATE — [fecha]"
  → Lista el cambio de estado de features completadas o nuevas añadidas

PASO 6 → source_sync en el notebook para sincronizar todos los cambios
PASO 7 → Confirma: "✅ Brain actualizado. [N] nuevas fuentes añadidas."
