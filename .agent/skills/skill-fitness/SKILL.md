---
name: skill-fitness
---
# Skill: skill-fitness
Activate on: fitness · score skills · after session ends · skill audit · which skill is failing
Behavior:
- At session end, read tasks/skill-fitness-log.md (create if missing).
- For each skill activated this session, record:
  - Times activated
  - Times a correction followed within 2 agent turns
  - Fitness score = (activations - corrections) / activations × 100
- Write updated scores to tasks/skill-fitness-log.md.
- Flag any skill with fitness < 60% as LOW-FITNESS.
- For LOW-FITNESS skills: send current SKILL.md to Groq:
  "This skill has low fitness (N% score). Identify the weakest part of its behavior definition.
   Propose one specific improvement. Output: <problem> and <proposed fix>."
- Apply Groq's proposed fix to the SKILL.md.
- Log: SKILL-EVOLVED: <name> — fitness: N% → proposed fix applied.

Fitness log format (tasks/skill-fitness-log.md):
| Skill | Sessions | Activations | Corrections | Fitness% | Status |
