# Implementation Plan — Install Agent Skills/Agents

Install 7 agent skills and 2 global agents to EstimaPro workspace by referencing canonical source repos.

## Phase 1 — Directory Structure Creation
- Create `.agent/skills/`
- Create `.github/agents/`
- Create `.github/skills/`

## Phase 2 — Install Skills (SKILL.md format)
Save the following skills to `.agent/skills/<skill-name>/SKILL.md`:
1. `lint-and-validate` - From https://raw.githubusercontent.com/vudovn/antigravity-kit/main/.agent/skills/lint-and-validate/SKILL.md
2. `tdd-workflow` - From https://raw.githubusercontent.com/cfrs2005/claude-init/main/templates/.claude/skills/tdd-workflow/SKILL.md
3. `deployment-pipeline-design` - From https://raw.githubusercontent.com/wshobson/agents/main/plugins/cicd-automation/skills/deployment-pipeline-design/SKILL.md
4. `agentic-eval` - From https://raw.githubusercontent.com/github/awesome-copilot/main/skills/agentic-eval/SKILL.md
5. `sast-configuration` - From https://raw.githubusercontent.com/wshobson/agents/main/plugins/security-scanning/skills/sast-configuration/SKILL.md
6. `resolve-conflicts` - From https://raw.githubusercontent.com/antinomyhq/forge/main/.forge/skills/resolve-conflicts/SKILL.md
7. `orchestrator` - From https://raw.githubusercontent.com/draphonix/skills/main/.agents/skills/orchestrator/SKILL.md

## Phase 3 — Install Agent (.agent.md format)
Save the following local references to `.github/agents/<agent-name>.agent.md`:
1. `devops-expert` - From https://raw.githubusercontent.com/github/awesome-copilot/main/agents/devops-expert.agent.md
2. `debug` - From https://raw.githubusercontent.com/github/awesome-copilot/main/agents/debug.agent.md

## Phase 4 — Create `tasks/lessons.md`
Initialize `tasks/lessons.md` with:
- Updated automatically by agentic-eval skill.
- Initial rules for bootstrap.

## Phase 5 — Verification & Git
- Confirm directory and file existence.
- Confirm skill activation.
- `git add .agent/ .github/agents/ tasks/lessons.md`
- Commit: `chore(skills): install official agent skills from source repos`
