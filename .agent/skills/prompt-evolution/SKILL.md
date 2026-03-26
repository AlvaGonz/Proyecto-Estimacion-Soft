---
name: prompt-evolution
---
# Skill: prompt-evolution
Activate on: prompt quality · rewrite prompt · optimize instruction · agent prompt failed · after BLOCKED outcome
Behavior:
- After any BLOCKED or REVERTED outcome, identify the prompt that caused it.
- Score the prompt: 1–5 on Clarity, Specificity, Constraint-coverage, Groq-compatibility.
- Send the low-scoring prompt to Groq with this instruction:
  "Rewrite this agent instruction to be clearer, more specific, and produce fewer reversals.
   Keep the same intent. Output only the improved instruction, no explanation."
- Model: use GROQ_MODEL_FAST (llama-3.1-8b-instant) for scoring, GROQ_MODEL_PRIMARY for rewriting.
- Replace the prompt in AGENTS.md only if score improves by ≥ 1 point.
- Log: PROMPT-EVOLVED: <section> — old score: N → new score: N
- Rate limit: max 10 prompt rewrites per session (Groq 100k token/day limit).
