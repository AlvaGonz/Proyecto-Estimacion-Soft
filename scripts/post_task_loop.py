"""
post_task_loop.py — EstimaPro EvoAgentX-style Post-Task Loop
Runs automatically after every agent task. Chains 5 Groq agents.
Usage: python scripts/post_task_loop.py --task "description" --output "what was produced"
"""
import os, sys, json, argparse, difflib
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from groq import Groq
from rich.console import Console
from rich.panel import Panel

load_dotenv()
console = Console()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
PRIMARY     = "llama-3.3-70b-versatile"
FAST        = "llama-3.1-8b-instant"
LESSONS_LOCAL  = Path("tasks/lessons.md")
ERRORS_LOCAL   = Path("tasks/error-patterns.md")
LOG_FILE       = Path("tasks/loop-log.md")
FITNESS_LOG    = Path("tasks/skill-fitness-log.md")
LESSONS_GLOBAL = Path.home() / ".agent-loop" / "lessons.md"

# --- Project grounding rules (loaded into every agent's context) ---
PROJECT_RULES = """
EstimaPro — Plataforma de Estimacion de Software Colaborativa
Stack: React 19 + TypeScript 5.8 + Vite 6 + Tailwind 4 + Node.js + MongoDB + Docker
Architecture: SPA + REST API (3-tier boundary)
Rules (non-negotiable):
1. 3-tier boundary: Frontend=presentation, Backend=business logic, DB=data only
2. JWT on every protected API route
3. RBAC enforced at controller level (Admin/Facilitador/Experto)
4. LOGAUDITORIA written on every state-changing operation in backend
5. Estimation rounds are immutable once closed
6. Method lock after Round 1 starts
7. Max file: 300 lines | Max function: 30 lines | Cyclomatic complexity <= 10
8. Test coverage new code >= 80%
9. No console.log in production — use structured logger
10. All commits: type(scope): message (Conventional Commits)
11. No secrets in git (.env* ignored)
"""


def get_session_memory() -> str:
    """Read local and global lessons to inject context."""
    memory = ""
    for path in [LESSONS_GLOBAL, LESSONS_LOCAL]:
        if path.exists():
            try:
                content = path.read_text(encoding="utf-8").strip()
                if content:
                    memory += f"\n--- MEMORY FROM {path.name} ---\n{content}\n"
            except Exception:
                pass
    return memory if memory else "No previous session memory found."


def call_groq(model: str, system: str, user: str, max_tokens: int = 800, json_mode: bool = False) -> str:
    if not GROQ_API_KEY:
        return "SKIP: No GROQ_API_KEY set."
    
    # Session memory injection (Requirement 4)
    memory_context = get_session_memory()
    enriched_system = f"{system}\n\n[SESSION_MEMORY_INSIGHTS]\n{memory_context}"
    
    client = Groq(api_key=GROQ_API_KEY)
    kwargs = {
        "model": model,
        "messages": [
            {"role": "system", "content": enriched_system},
            {"role": "user",   "content": user}
        ],
        "max_tokens": max_tokens,
        "temperature": 0.1
    }
    
    if json_mode:
        kwargs["response_format"] = {"type": "json_object"}

    resp = client.chat.completions.create(**kwargs)
    return resp.choices[0].message.content.strip()


def agent_evaluator(task: str, output: str) -> dict:
    """Agent 1: Dual-Score the task output 0-100 (Requirement 3)."""
    system = (
        f"You are a senior auditor for EstimaPro.\n{PROJECT_RULES}\n"
        "Respond ONLY in JSON: {\"output_score\": int, \"protocol_score\": int, \"summary\": str}"
    )
    user = (
        f"Task completed: {task}\n\nOutput/changes produced:\n{output}\n\n"
        "Evaluate on two axes:\n"
        "1. output_score: Quality, correctness, and functionality of the code.\n"
        "2. protocol_score: Compliance with folder structure, naming, RBAC rules, and LDR constraints.\n"
        "Score both 0-100 and give a 1-sentence summary."
    )
    raw = call_groq(PRIMARY, system, user, 300, json_mode=True)
    try:
        data = json.loads(raw)
        # Weighting: Output (60%) + Protocol (40%)
        data["score"] = int((data.get("output_score", 0) * 0.6) + (data.get("protocol_score", 0) * 0.4))
        return data
    except Exception:
        return {"score": 0, "output_score": 0, "protocol_score": 0, "summary": raw}


def agent_critic(task: str, output: str, score: int) -> list:
    """Agent 2: List specific issues found."""
    system = (
        f"You are a strict code critic for EstimaPro.\n{PROJECT_RULES}\n"
        "Respond ONLY in JSON: [{\"issue\": str, \"severity\": \"HIGH|MEDIUM|LOW\", \"file\": str|null}]"
    )
    user = (
        f"Task: {task}\nOutput: {output}\nEvaluator score: {score}/100\n\n"
        "List ALL issues. If none, return []."
    )
    raw = call_groq(PRIMARY, system, user, 600, json_mode=True)
    try:
        return json.loads(raw)
    except Exception:
        return [{"issue": raw, "severity": "LOW", "file": None}]


def agent_mutator(issues: list, output: str) -> list:
    """Agent 3: Propose minimal fix mutations."""
    if not issues:
        return []
    system = (
        f"You are a code mutation engine for EstimaPro.\n{PROJECT_RULES}\n"
        "Respond ONLY in JSON: [{\"mutation\": str, \"targets\": str, \"priority\": \"HIGH|MEDIUM|LOW\"}]"
    )
    user = (
        f"Issues found:\n{json.dumps(issues, indent=2)}\n\n"
        "Propose minimal, surgical mutations to fix each HIGH and MEDIUM issue. Max 5 mutations."
    )
    raw = call_groq(FAST, system, user, 600, json_mode=True)
    try:
        return json.loads(raw)
    except Exception:
        return []


def agent_validator(mutations: list, task: str) -> dict:
    """Agent 4: Accept/reject each mutation."""
    if not mutations:
        return {"approved": [], "rejected": [], "verdict": "NO_ISSUES"}
    system = (
        f"You are a validation gate for EstimaPro.\n{PROJECT_RULES}\n"
        "Respond ONLY in JSON: {\"approved\": [str], \"rejected\": [str], \"verdict\": \"PASS|FAIL\"}"
    )
    user = (
        f"Task: {task}\nProposed mutations:\n{json.dumps(mutations, indent=2)}\n\n"
        "Approve mutations that are safe and minimal. Reject scope-creep mutations."
    )
    raw = call_groq(FAST, system, user, 400, json_mode=True)
    try:
        return json.loads(raw)
    except Exception:
        return {"approved": [], "rejected": [], "verdict": "FAIL"}


def _append_to_file(path: Path, lines: list[str]):
    """Helper to append lines to a file."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "a", encoding="utf-8") as f:
        for line in lines:
            f.write(f"\n{line}")

def identify_responsible_skill(task: str, issues: list) -> str | None:
    """Agent: Identify which .agent/skills/ prompted the error (Requirement 1)."""
    skills_dir = Path(".agent/skills")
    if not skills_dir.exists():
        return None
    available_skills = [d.name for d in skills_dir.iterdir() if d.is_dir()]
    console.print(f"  [dim]Scanning {len(available_skills)} skills...[/dim]")
    
    system = "You are a meta-agent mapping task issues to specific .agent/skills/ folders."
    user = (
        f"Task: {task}\nIssues: {json.dumps(issues)}\n"
        f"Available skills: {available_skills}\n"
        "Return ONLY the folder name of the most responsible skill or 'NONE'."
    )
    res = call_groq(FAST, system, user, 100).lower()
    found_skill = None
    for s in available_skills:
        # Check for exact match or word-boundary match
        if s.lower() in res:
            found_skill = s
            break
    
    if found_skill:
        console.print(f"  [dim]Skill identified: {found_skill}[/dim]")
    return found_skill

def evolve_skill_prompt(skill_name: str, issues: list, task: str):
    """Agent: Rewrite the skill using EvoPrompt DE-style mutation (Requirement 2)."""
    skill_path = Path(f".agent/skills/{skill_name}/SKILL.md")
    if not skill_path.exists():
        return
    
    original_content = skill_path.read_text(encoding="utf-8")
    system = (
        "You are a Prompt Engineer. Rewrite the following SKILL.md to fix the reported issues "
        "while preserving the YAML metadata and core behavior. Use 'Differential Evolution' "
        "principles: add missing constraints, clarify ambiguous terminology, and strengthen guarding logic."
    )
    user = (
        f"Skill: {skill_name}\nReported Issues: {json.dumps(issues)}\n"
        f"Task Context: {task}\n\nOriginal SKILL.md:\n{original_content}\n\n"
        "Output ONLY the complete updated SKILL.md file."
    )
    mutated = call_groq(FAST, system, user, 2000)
    if mutated and not mutated.startswith("SKIP"):
        # Generate diff for transparency (Requirement: WOW the user)
        diff = difflib.unified_diff(
            original_content.splitlines(),
            mutated.splitlines(),
            fromfile="original",
            tofile="evolved",
            lineterm=""
        )
        diff_str = "\n".join(diff)
        
        skill_path.write_text(mutated, encoding="utf-8")
        console.print(f"  [bold green]EVOLVED:[/bold green] {skill_name}")
        
        # Log the evolution event
        evolve_log = [
            f"### [EVOLUTION] Skill: {skill_name}",
            f"**Issues addressed:** {len(issues)}",
            "```diff",
            f"{diff_str}",
            "```"
        ]
        _append_to_file(LOG_FILE, evolve_log)

def update_fitness_log(skill_name: str, score: int):
    """Log skill performance to tasks/skill-fitness-log.md (Requirement 6)."""
    FITNESS_LOG.parent.mkdir(exist_ok=True)
    lines = []
    if FITNESS_LOG.exists():
        lines = FITNESS_LOG.read_text(encoding="utf-8").splitlines()
    
    header = "| skill_name | activation_count | avg_score | fitness_label | last_evolved |"
    if not lines:
        lines = [header, "| --- | --- | --- | --- | --- |"]
    
    # Update or add entry
    found = False
    for i, line in enumerate(lines):
        if line.startswith(f"| {skill_name} |"):
            idx = i
            found = True
            break
    
    timestamp = datetime.now().strftime("%Y-%m-%d")
    if found:
        parts = [p.strip() for p in lines[idx].split("|") if p.strip()]
        count = int(parts[1]) + 1
        avg = int((float(parts[2]) * (count-1) + score) / count)
        label = "HIGH" if avg >= 85 else ("MED" if avg >= 60 else "LOW")
        lines[idx] = f"| {skill_name} | {count} | {avg} | {label} | {timestamp} |"
    else:
        label = "HIGH" if score >= 85 else ("MED" if score >= 60 else "LOW")
        lines.append(f"| {skill_name} | 1 | {score} | {label} | {timestamp} |")
    
    FITNESS_LOG.write_text("\n".join(lines), encoding="utf-8")

def agent_archivist(task: str, issues: list, mutations: list, score: int, verdict: str):
    """Agent 5: Persist lessons, errors, patterns and Evolve Skills."""
    if not issues and score >= 85:
        # Still log performance even on success
        skill_name = identify_responsible_skill(task, [])
        if skill_name:
            update_fitness_log(skill_name, score)
        return

    # 1. Identify and Evolve (Requirement 1 & 2)
    high_issues = [i for i in issues if i.get("severity") == "HIGH"]
    skill_name = identify_responsible_skill(task, issues)
    if skill_name:
        update_fitness_log(skill_name, score)
        if high_issues:
            evolve_skill_prompt(skill_name, issues, task)

    # 2. Persist Lessons
    system = "Archivist agent. JSON: {\"lessons\": [str], \"patterns\": [str]}"
    user = f"Task: {task}\nScore: {score}\nIssues: {json.dumps(issues)}\nVerdict: {verdict}"
    raw = call_groq(PRIMARY, system, user, 400, json_mode=True)
    try:
        data = json.loads(raw)
    except Exception:
        data = {"lessons": [raw], "patterns": []}
    
    timestamp = datetime.now().strftime("%Y-%m-%d")
    lessons = [f"- [{timestamp}] LESSON: {l}" for l in data.get("lessons", [])]
    patterns = [f"- [{timestamp}] PATTERN: {p}" for p in data.get("patterns", [])]
    
    _append_to_file(LESSONS_LOCAL, lessons + patterns)
    _append_to_file(LESSONS_GLOBAL, [f"- [{timestamp}][EstimaPro] LESSON: {l}" for l in data.get("lessons", [])])
    
    if high_issues:
        error_lines = [f"| `{i['issue'][:60]}` | {i.get('file', '?')} | auto | {timestamp} |" for i in high_issues]
        _append_to_file(ERRORS_LOCAL, error_lines)


def write_log(task: str, score: int, output_score: int, protocol_score: int, issues: list, mutations: list, verdict: str, summary: str):
    """Write human-readable log to tasks/loop-log.md."""
    LOG_FILE.parent.mkdir(exist_ok=True)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(f"\n\n---\n## [{datetime.now().strftime('%Y-%m-%d %H:%M')}] {task[:80]}\n")
        f.write(f"**Final Score:** {score}/100 (Output: {output_score}, Protocol: {protocol_score}) | **Verdict:** {verdict}\n")
        f.write(f"**Summary:** {summary}\n")
        if issues:
            f.write(f"\n**Issues ({len(issues)}):**\n")
            for i in issues:
                f.write(f"- [{i['severity']}] {i['issue']} ({i.get('file', '?')})\n")
        if mutations:
            f.write(f"\n**Approved Mutations:**\n")
            for m in mutations:
                f.write(f"- {m}\n")


def run_loop(task: str, output: str) -> int:
    """Main loop. Returns exit code."""
    if not GROQ_API_KEY:
        console.print("[yellow]GROQ_API_KEY not set — post-task loop skipped.[/yellow]")
        return 0
    console.print(Panel(f"[bold cyan]Post-Task Loop[/bold cyan]\n{task[:100]}"))
    
    # 1. Evaluate
    console.print("[dim]Agent 1/5: Evaluating...[/dim]")
    eval_res = agent_evaluator(task, output)
    score = eval_res.get("score", 0)
    out_s = eval_res.get("output_score", 0)
    pro_s = eval_res.get("protocol_score", 0)
    summ = eval_res.get("summary", "")
    console.print(f"  Score: [bold]{score}/100[/bold] (Out: {out_s}, Pro: {pro_s})")

    # 2. Critique
    console.print("[dim]Agent 2/5: Critiquing...[/dim]")
    issues = agent_critic(task, output, score)
    high = [i for i in issues if i.get("severity") == "HIGH"]
    console.print(f"  Issues: {len(issues)} total, {len(high)} HIGH")

    # 3. Mutate & Validate
    console.print("[dim]Agent 3/5 & 4/5: Mutating & Validating...[/dim]")
    muts = agent_mutator(issues, output)
    val = agent_validator(muts, task)
    verdict, approved = val.get("verdict", "UNKNOWN"), val.get("approved", [])
    console.print(f"  Verdict: [bold]{verdict}[/bold] | Approved: {len(approved)}")

    # 4. Archive & Evolve (Agent 5)
    console.print("[dim]Agent 5/5: Archiving & Evolving...[/dim]")
    agent_archivist(task, issues, approved, score, verdict)
    write_log(task, score, out_s, pro_s, issues, muts, verdict, summ)

    print(json.dumps({
        "score": score, 
        "output_score": out_s,
        "protocol_score": pro_s,
        "verdict": verdict, 
        "issues": len(issues), 
        "high_issues": len(high)
    }))
    return 1 if high else 0


if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="EstimaPro EvoAgentX Post-Task Loop — runs after every agent task."
    )
    parser.add_argument("--task",   required=True,  help="Description of completed task")
    parser.add_argument("--output", required=False,
                        default="(no output description provided)",
                        help="What was produced / files changed")
    args = parser.parse_args()
    sys.exit(run_loop(args.task, args.output))
