# AGENTS.md — EstimaPro Platform
# Compatible: Antigravity · Cursor · Claude Code

---

## 1. Project Overview

| Field | Value |
|---|---|
| Name | EstimaPro — Collaborative Software Estimation Platform |
| Type | Full-stack Web App (SPA + REST API) |
| Stage | Active Development |
| Branch convention | `feature/`, `fix/`, `chore/`, `refactor/`, `ci/`, `docs/`, `test/` |
| Docs grounding | `@Proyecto-Plataforma de Estimación` (LDR source of truth) |

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
<<<<<<< HEAD
| Frontend | React 18 + TypeScript 5 (strict) + Vite + Tailwind |
=======
| Frontend | React 19 + TypeScript 5 (strict) + Vite 6 + Tailwind 4 |
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9
| Backend | Node.js + Express + TypeScript |
| Database | MongoDB (Mongoose) |
| Auth | JWT + RBAC (Roles: Admin, Facilitador, Experto) |
| Containerization | Docker + Docker Compose (3 containers: frontend, backend, DB) |
| Testing (frontend) | Vitest + Playwright |
<<<<<<< HEAD
| Testing (backend) | Jest |
| CI/CD | GitHub Actions (`.github/workflows/`) |
| Package manager | npm |
| Linter | ESLint + Prettier |
=======
| Testing (backend) | Vitest |
| CI/CD | GitHub Actions (`.github/workflows/`) |
| Package manager | npm |
| Linter | TypeScript (noEmit) |
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9
| Agent LLM | Groq Cloud — `llama-3.3-70b-versatile` / `llama-3.1-8b-instant` |

---

## 3. Architecture Constraints (Non-Negotiable)

These rules apply to every agent task without exception.

- **3-tier boundary is sacred.** Frontend = presentation only. Backend = all business logic. Database = data access only.
- **Feature-based frontend.** `src/features/<domain>/` owns components, hooks, and service calls for that domain. `src/components/` = reusable UI only.
- **Domain-based backend.** `server/src/modules/<domain>/` owns controller, service, routes, validators, and models for that domain.
- **JWT on every protected API route.** No endpoint that reads or writes user/project data may be unguarded.
- **RBAC enforced at controller level.** Admin, Facilitador, Experto have distinct permission sets as defined in the LDR.
- **Audit log is mandatory.** All state-changing operations must write to `LOGAUDITORIA`. Never skip this.
- **Estimation rounding is closed.** Once a round is marked closed, no estimation may be modified. Enforce at DB and API level.
- **Method lock on first round.** The estimation method (Wideband Delphi, Planning Poker, Three Points) cannot change after Round 1 starts.

Read `.agent/rules/architecture.md` before any structural change.
Read `.agent/rules/security.md` before any auth, RBAC, or data access change.

---

## 4. Activated Skills

Skills live in `.agent/skills/`. The agent reads the skill name and description on load and activates the full SKILL.md only when the relevant task begins.

> ⚡ Activation is **keyword-triggered and task-triggered**. The keywords below are the primary triggers.

<<<<<<< HEAD
### 4.1 — `lint-and-validate`
- **Source:** `.agent/skills/awesome-agent-skills/lint-and-validate/SKILL.md`
- **Activate on:** lint · format · validate · typecheck · static analysis · after any code edit
- **Behavior:** Run ESLint + TypeScript check after every code modification without waiting to be asked.
- **Required:** Yes — runs automatically after every file change.

### 4.2 — `tdd-workflow`
- **Source:** `.agent/skills/awesome-copilot/tdd-workflow/SKILL.md`
- **Activate on:** write test · new feature · bug fix · refactor · unit test · vitest · playwright · jest
- **Behavior:** Red → Green → Refactor. Write a failing test first. Only mark complete when tests pass.
- **Required:** Yes — no task is complete without a passing test or a documented gap reason.

### 4.3 — `orchestrator`
- **Source:** `.agent/skills/orchestrator/SKILL.md`
- **Activate on:** plan · multi-step · subagent · parallel · epic · decompose · orchestrate
- **Behavior:** Before executing any 3+ step task, enter Planning mode. Decompose into subgoals. One goal per subagent. Clean context per subagent. Read `tasks/lessons.md` before planning.

### 4.4 — `agentic-eval`
- **Source:** `.agent/skills/agentic-eval/SKILL.md`
- **Activate on:** evaluate · review output · self-critique · check quality · improvement · after any correction
- **Behavior:** After every agent correction or reversal, write one rule starting with `LESSON:` to `tasks/lessons.md`. Never skip.

### 4.5 — `sast-configuration`
- **Source:** `.agent/skills/awesome-agent-skills/sast-configuration/SKILL.md`
- **Activate on:** security · SAST · vulnerability · CodeQL · npm audit · secrets · hardcode · RNF001 · RNF002 · RNF003 · RNF004
- **Behavior:** Configure or invoke security scanning before merging to main. Block HIGH/CRITICAL CVEs.

### 4.6 — `resolve-conflicts`
- **Source:** `.agent/skills/resolve-conflicts/SKILL.md`
- **Activate on:** merge conflict · branch divergence · overlap · rebase · stale diff
- **Behavior:** Do not attempt to resolve conflicts directly. Invoke this skill first. Use structured merge framework.

### 4.7 — `deployment-pipeline-design`
- **Source:** `.agent/skills/deployment-pipeline-design/SKILL.md`
- **Activate on:** CI · CD · workflow · pipeline · github actions · deploy · security.yml · notify.yml
- **Behavior:** When designing or modifying GitHub Actions workflows, enforce multi-stage design with lint → test → build → security → deploy gates.

=======
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9
---

## 5. Workflows (Slash Commands)

Workflows are stored in `.agent/workflows/`. Invoke with a slash command in the agent prompt.

| Slash Command | File | Trigger |
|---|---|---|
| `/audit-chores` | `.agent/workflows/audit-chores.md` | Full repo audit: dead code, structure, boundaries |
| `/cleanup-dead-code` | `.agent/workflows/cleanup-dead-code.md` | Remove unused files, deps, and stale artifacts |
| `/restructure-frontend` | `.agent/workflows/restructure-frontend.md` | Enforce `src/features/<domain>/` structure |
| `/restructure-backend` | `.agent/workflows/restructure-backend.md` | Enforce `server/src/modules/<domain>/` structure |
| `/verify-boundaries` | `.agent/workflows/verify-boundaries.md` | Verify frontend/backend/DB layer separation |
| `/security-audit` | `.agent/workflows/security-audit.md` | Scan deps, secrets, JWT/RBAC coverage |
| `/ci-audit` | `.agent/workflows/ci-audit.md` | Audit workflow files against LDR gaps |
| `/lessons-review` | `.agent/workflows/lessons-review.md` | Summarize and deduplicate tasks/lessons.md |
| `/evolve-prompts` | `.agent/workflows/evolve-prompts.md` | Run prompt-evolution on all BLOCKED prompts this session |
| `/evolve-skills` | `.agent/workflows/evolve-skills.md` | Run skill-fitness + Groq rewrite for LOW-FITNESS skills |
| `/memory-sync` | `.agent/workflows/memory-sync.md` | Load cross-session memory and surface top risks |
| `/coverage-backlog` | `.agent/workflows/coverage-backlog.md` | Generate test specs for all domains < 20% coverage |
| `/error-digest` | `.agent/workflows/error-digest.md` | Summarize error-patterns.md and surface top 3 recurring patterns |
| `/ci-autofix` | `.agent/workflows/ci-autofix.md` | CI failed — read logs via GitHub MCP, fix, critic-gate push |
<<<<<<< HEAD
=======
| `/post-task-hook` | `.agent/workflows/post-task-hook.md` | Run EvoAgentX post-task loop (eval→critic→mutate→validate→archive) |
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9

> Workflows run in **Planning mode** by default unless explicitly stated otherwise.

---

## 6. Rules Files

Rules are stored in `.agent/rules/`. The agent must read the relevant rule file before acting.

| Rule File | Load When |
|---|---|
| `.agent/rules/architecture.md` | Any structural change · feature addition · refactoring |
| `.agent/rules/security.md` | Any auth · JWT · RBAC · encryption · secrets-adjacent work |
| `.agent/rules/testing.md` | Any test creation · coverage change · CI failure |
| `.agent/rules/git-conventions.md` | Any commit · PR · branch creation |
| `.agent/rules/agent-behavior.md` | Start of every session — loaded automatically |

---

## 7. MCP Servers

Configured in `mcp_config.json`.
Access in Antigravity via: **`...` menu → MCP Servers → Manage MCP Servers → View raw config**

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${workspaceFolder}"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

> **Recommended addition (when ready):** Add a MongoDB MCP server so agents can query the DB schema live instead of inferring it.
> **MCP secret rule:** Never paste live tokens into `mcp_config.json`. Use `${ENV_VAR}` references only.

---

<<<<<<< HEAD
## 8. Agent Behavior Rules (Always Active)

These rules are loaded on every session and apply to all agents.

```
1. PLAN FIRST. Any task with 3+ steps enters Planning mode before execution.
   Use the `orchestrator` skill. Do not start writing code on a multi-step task.

2. ONE GOAL PER SUBAGENT. Each agent receives exactly one well-defined objective.
   Do not mix audit + feature work in the same agent run.

3. READ LESSONS FIRST. Open `tasks/lessons.md` at the start of any non-trivial task.
   Do not repeat a mistake that has already been logged.

4. TEST BEFORE DONE. Never mark a task complete without running lint, build, and tests.
   Use the `tdd-workflow` skill. Document exact failure if tests cannot pass yet.

5. MINIMAL IMPACT. Change only what is needed. No opportunistic refactors
   that expand the scope of the current task.

6. NO SECRETS IN REPO. Never commit .env, hardcoded API keys, JWT secrets, Mongo URIs,
   SMTP credentials, or Groq keys. These live in .env only and .env is gitignored.

7. AUDIT LOG ALWAYS. Every state-changing operation must write to LOGAUDITORIA.
   If an implementation skips this, flag it as a blocking gap.

8. ROOT CAUSE FIRST. When fixing a bug, identify the root cause before writing the fix.
   A band-aid fix that masks a deeper issue is not acceptable.

9. WRITE LESSONS. When a correction is made or a reversal occurs, use `agentic-eval`
   to write one durable rule to tasks/lessons.md. Always.

10. SENIOR APPROVAL TEST. Before finalizing any implementation, ask:
    "Would a senior engineer approve this?" If the answer is uncertain, simplify.
```

---

## 9. Git Conventions

- **Commit format:** `type(scope): message`
- **Types:** `feat` · `fix` · `chore` · `refactor` · `test` · `docs` · `ci` · `perf`
- **PR title:** max 72 characters
- **Branch naming:** `feature/`, `fix/`, `chore/`, `refactor/`, `ci/`, `docs/`
- **No force-push to `main` or `develop`**
- **Commit after each checkpoint**, not at the end of the entire task

---

## 10. Code Quality Targets
=======
## 8. Code Quality Targets
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9

| Rule | Limit |
|---|---|
| Max file length | 300 lines (split larger files) |
| Max function length | 30 lines |
| Cyclomatic complexity | ≤ 10 per function |
| Test coverage (new code) | ≥ 80% |
| Console.log in production | ❌ Forbidden — use structured logger |
| Default exports | ❌ Prefer named exports |
| Exported functions | ✅ Must have JSDoc |

---

<<<<<<< HEAD
## 11. LDR Domain Coverage (Required Modules)
=======
## 9. LDR Domain Coverage (Required Modules)
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9

These modules must exist in both frontend features and backend modules.
Flag as `[MISSING]` in any audit if absent.

| Domain | Frontend Feature | Backend Module | LDR Source |
|---|---|---|---|
| Authentication | `src/features/auth/` | `server/src/modules/auth/` | RF001–RF004 |
| Users & Roles | `src/features/users/` | `server/src/modules/users/` | RF003–RF005 |
| Projects | `src/features/projects/` | `server/src/modules/projects/` | RF006–RF010 |
| Tasks | `src/features/tasks/` | `server/src/modules/tasks/` | RF008 |
| Rounds | `src/features/rounds/` | `server/src/modules/rounds/` | RF012–RF014 |
| Estimations | `src/features/estimations/` | `server/src/modules/estimations/` | RF012–RF013 |
| Metrics & Stats | `src/features/metrics/` | `server/src/modules/metrics/` | RF015–RF019 |
| Convergence | `src/features/convergence/` | `server/src/modules/convergence/` | RF020–RF022 |
| Discussion | `src/features/discussion/` | `server/src/modules/discussion/` | RF023–RF024 |
| Notifications | `src/features/notifications/` | `server/src/modules/notifications/` | RF025 |
| Reports | `src/features/reports/` | `server/src/modules/reports/` | RF028–RF029 |
| Audit Log | `src/features/audit-log/` | `server/src/modules/audit-log/` | RNF007 |

---

<<<<<<< HEAD
## 12. Env & Secrets Policy
=======
## 10. Env & Secrets Policy
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9

```
# .env — LOCAL ONLY. Never committed.
GROQ_API_KEY=                          # Groq free tier key
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL_PRIMARY=llama-3.3-70b-versatile
GROQ_MODEL_FAST=llama-3.1-8b-instant
<<<<<<< HEAD
VITE_API_URL=http://localhost:3001/api  # Replaced with secret in CI
=======
VITE_API_URL=http://localhost:4000/api  # Corrected to Backend Port
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9
MONGO_URI=                             # Local only
JWT_SECRET=                            # Local only — rotate before any public deploy
SMTP_HOST=                             # Local only
SMTP_USER=                             # Local only
SMTP_PASS=                             # Local only
```

CI/CD secrets: GitHub Actions Secrets only. Never in workflow files.
See `docs/security/secrets.md` for rotation policy.

---

<<<<<<< HEAD
## 13. Nested AGENTS.md (Subdirectory Rules)
=======
## 11. Nested AGENTS.md (Subdirectory Rules)
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9

Enable in: **Settings → Agent → Load nested AGENTS.md files**

| Path | Scope |
|---|---|
| `src/AGENTS.md` | Frontend-specific: component conventions, no business logic, Tailwind rules |
| `server/AGENTS.md` | Backend-specific: module structure, middleware, DB access patterns |
| `.github/AGENTS.md` | CI/CD only: workflow structure, secret usage, branch protection rules |

---

<<<<<<< HEAD
## 14. Self-Improvement Loop (Expanded)
=======
## 12. Self-Improvement Loop (Expanded)
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9

Every session runs these loops in order:

**Session Start:**
1. `cross-session-memory` — Load last 3 session summaries from tasks/session-memory.md.
2. Read `tasks/lessons.md` — do not repeat known mistakes.
3. Read `tasks/error-patterns.md` — check for known failure conditions.
4. Read `tasks/skill-fitness-log.md` — avoid using LOW-FITNESS skills as primary.

**During Session (automatic, event-triggered):**
5. `error-pattern-mining` — fires after every bug fix.
6. `prompt-evolution` — fires after every BLOCKED or REVERTED outcome.
7. `skill-fitness` — records activation events in background.
<<<<<<< HEAD

**Session End:**
8. `workflow-evolution` — runs after each completed slash command.
9. `skill-fitness` — computes scores, flags LOW-FITNESS skills, triggers Groq rewrite.
10. `agentic-eval` — appends LESSON: entries to tasks/lessons.md.
11. `coverage-evolution` — generates test specs for top 5 coverage gaps.
12. `cross-session-memory` — Groq generates session summary, appends to tasks/session-memory.md.
13. `self-improvement` — Groq synthesizes RULE/PATTERN/GAP lessons, updates AGENTS.md.
=======
8. `post-task-loop` — fires after EVERY completed task (Rule 11). Chains: Evaluate → Critic → Mutate → Validate → Archive.

**Session End:**
9. `workflow-evolution` — runs after each completed slash command.
10. `skill-fitness` — computes scores, flags LOW-FITNESS skills, triggers Groq rewrite.
11. `agentic-eval` — appends LESSON: entries to tasks/lessons.md.
12. `coverage-evolution` — generates test specs for top 5 coverage gaps.
13. `cross-session-memory` — Groq generates session summary, appends to tasks/session-memory.md.
14. `self-improvement` — Groq synthesizes RULE/PATTERN/GAP lessons, updates AGENTS.md.
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9

Global memory: ~/.agent-loop/lessons.md (cross-project)
Import: from bootstrap import SelfImprovementCrew

---

<<<<<<< HEAD
## 15. Implementation Plan Protocol
=======
## 13. Implementation Plan Protocol
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9

When Antigravity generates an **Implementation Plan** artifact:
- Review it before approving execution.
- Reject plans that touch more than one domain in a single agent run.
- Require a Walkthrough artifact after completion confirming what changed.

<<<<<<< HEAD
## 16. Antigravity-Native Repo Constitution
=======
---

## 14. Antigravity-Native Repo Constitution
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9
- **Planning-First Rule:** Every major refactor must start with an implementation plan. 
- **Validation-Before-Done Rule:** Prove passing tests, lint, and build step outputs before claiming a task is done. 
- **One-Goal-Per-Agent Rule:** Agents cannot be tasked to operate outside of a single feature scope simultaneously.

<<<<<<< HEAD
## 17. Session Delta — 2026-03-25

- **Test Report Generated:** Validated all frontend and backend tests. `20` frontend tests and `21` backend tests passed successfully with 0 failures out of the box.
- **Coverage Tracked:** Frontend tests demonstrated `96.66%` coverage, passing the quality threshold (≥ 80%). Backend tests recorded `7.9%` with detailed coverage gaps documented across 13 domains.
- **Context Updated:** Appended context health and test report details to `tasks/TEST-REPORT.md`.

## 18. Evolution Engine — Groq Self-Improvement Dimensions

The agent runs the following evolution loops automatically.
Groq (llama-3.3-70b-versatile / llama-3.1-8b-instant) is the inference engine for all loops.
All evolution output is written to the `tasks/` directory.

| Dimension | Skill | Trigger | Output File |
|---|---|---|---|
| Prompt Evolution | `prompt-evolution` | After BLOCKED/REVERTED outcome | AGENTS.md (inline) |
| Workflow Evolution | `workflow-evolution` | After any slash command finishes | `.agent/workflows/*.md` |
| Skill Fitness | `skill-fitness` | Session end | `tasks/skill-fitness-log.md` |
| Error Pattern Mining | `error-pattern-mining` | After any bug fix | `tasks/error-patterns.md` |
| Coverage Gap Tracking | `coverage-evolution` | After test report | `tasks/test-backlog.md` |
| Cross-Session Memory | `cross-session-memory` | Session start + end | `tasks/session-memory.md` |
| CI Failure Loop | `deployment-pipeline-design` + `error-pattern-mining` | On: GitHub MCP detects failed run | `tasks/error-patterns.md` + auto-fix PR |

### Groq Token Budget (100k/day)
| Task | Model | Est. tokens/call | Max calls/session |
|---|---|---|---|
| Prompt rewrite | PRIMARY | ~800 | 10 |
| Workflow evolution | PRIMARY | ~600 | 3 |
| Skill fitness rewrite | FAST | ~400 | 5 |
| Error pattern extraction | FAST | ~300 | 20 |
| Coverage spec generation | FAST | ~500 | 5 |
| Session memory summary | PRIMARY | ~700 | 1 |
| **Session total (max)** | | **~16,800** | **< 17% of daily budget** |

---

*Last updated: 2026-03-25 — Added: ci-autofix workflow, CI Failure Loop evolution dimension, .github/AGENTS.md, replication bootstrap*
=======
---

## 16. AI Agent Loop

This project uses a Groq-powered post-task evaluation loop.

After each completed task, activate the loop:
```bash
python scripts/post_task_loop.py --task "{{task description}}" --output "{{what was done}}"
```

The loop scores the output and writes LESSON: and PATTERN: entries to:
- `tasks/loop-log.md` — scored task history with verdict and issues.
- `tasks/lessons.md` — persistent lessons learned (loaded at session start).
- `tasks/error-patterns.md` — recurring error patterns for auto-healing.

**Target score: ≥ 85.** Iterate if score < 85 or `high_issues > 0`.

---

*Last updated: 2026-03-27 — Audited tech stack (React 19, Vite 6, Tailwind 4), ports (4000), and AI loop scripts.*
>>>>>>> 4e67803f0d3febe54d51e7aedb2ef04496ea19c9
