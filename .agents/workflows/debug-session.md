---
description: /debug-session
---

WORKFLOW: /debug-session
TRIGGER: Cuando encuentras un error o comportamiento inesperado

ERROR / SÍNTOMA: [PEGA EL ERROR COMPLETO O DESCRIBE EL COMPORTAMIENTO]
ARCHIVO DONDE OCURRE: [PATH]
QUÉ INTENTASTE: [SI ALGO]

PASO 1 → Ejecuta /consult-brain para verificar si este bug tiene un ADR o fue
         previamente documentado en Fuente 5 (BUG log).

PASO 2 → Analiza el stack trace siguiendo el Protocolo ARQ (ARQ.txt):
  - Lee el trace completo — no adivines
  - Identifica el punto exacto de fallo (archivo + línea)
  - Clasifica: ¿Error de tipo? ¿Lógica de negocio? ¿Violación de dominio Delphi?
  - Responde: ¿Violó alguna regla de types.ts o del ciclo de estados?

PASO 3 → Genera el AGENT PROMPT quirúrgico para Antigravity:
  - Context: @[archivo exacto donde falla] @types.ts
  - Objetivo: fix específico sin tocar código adyacente
  - Constraint: No refactorices más allá del fix. Un cambio atómico.
  - Verification: npm run lint debe pasar. Describe el comportamiento esperado.

PASO 4 → Después del fix, ejecuta /update-brain con:
  → BUG-[N]: síntoma, root cause, fix, commit hash
