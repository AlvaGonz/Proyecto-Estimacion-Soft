# /evolve-prompts — LOW-FITNESS Evolution Workflow

This workflow automates the optimization of underperforming agent skills.

## Steps

1. **Audit Fitness**: Scan `tasks/skill-fitness-log.md` for skills with `fitness_label: LOW` or `avg_score < 70`.
2. **Context Gathering**: For each low-fitness skill, read its `SKILL.md` and related `tasks/error-patterns.md` entries.
3. **EvoPrompt Execution**:
   - Call Groq 8B with the "Differential Evolution" prompt.
   - Use high-scoring tasks from `tasks/loop-log.md` as "positive examples" if available.
4. **Validation**: Check if the mutated `SKILL.md` preserves required YAML headers and structural markers.
5. **Deployment**: Overwrite the `SKILL.md` file.
6. **Logging**: Update `last_evolved` in `tasks/skill-fitness-log.md`.
7. **Commit**: `chore(agent): evolve low-fitness skills [skill_names]`
