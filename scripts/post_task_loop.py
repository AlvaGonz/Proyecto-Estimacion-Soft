"""
post_task_loop.py — EstimaPro EvoAgentX-style Post-Task Loop
Runs automatically after every agent task. Chains 5 Groq agents.
Usage: python scripts/post_task_loop.py --task "description" --output "what was produced"
"""
import os, sys, json, argparse
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
LESSONS_GLOBAL = Path.home() / ".agent-loop" / "lessons.md"

# --- Project grounding rules (loaded into every agent's context) ---
PROJECT_RULES = """
EstimaPro — Plataforma de Estimacion de Software Colaborativa
Stack: React 18 + TypeScript 5 + Node.js + Express + MongoDB + Docker
Rules (non-negotiable):
1. 3-tier boundary: Frontend=presentation, Backend=business logic, DB=data only
2. JWT on every protected route
3. RBAC enforced at controller level (Admin/Facilitador/Experto)
4. LOGAUDITORIA written on every state-changing operation
5. Estimation rounds are immutable once closed
6. Method lock after Round 1 starts
7. Max file: 300 lines | Max function: 30 lines | Cyclomatic complexity <= 10
8. Test coverage new code >= 80%
9. No console.log in production — use structured logger
10. All commits: type(scope): message (Conventional Commits)
"""


def call_groq(model: str, system: str, user: str, max_tokens: int = 600) -> str:
    if not GROQ_API_KEY:
        return "SKIP: No GROQ_API_KEY set."
    client = Groq(api_key=GROQ_API_KEY)
    resp = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user",   "content": user}
        ],
        max_tokens=max_tokens,
        temperature=0.1
    )
    return resp.choices[0].message.content.strip()


def agent_evaluator(task: str, output: str) -> dict:
    """Agent 1: Score the task output 0-100."""
    system = (
        f"You are a senior software quality evaluator for EstimaPro.\n{PROJECT_RULES}\n"
        "Respond ONLY in JSON: {\"score\": int, \"summary\": str}"
    )
    user = (
        f"Task completed: {task}\n\nOutput/changes produced:\n{output}\n\n"
        "Score 0-100 and give a 1-sentence summary."
    )
    raw = call_groq(PRIMARY, system, user, 200)
    try:
        return json.loads(raw)
    except Exception:
        return {"score": 0, "summary": raw}


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
    raw = call_groq(PRIMARY, system, user, 600)
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
    raw = call_groq(FAST, system, user, 600)
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
    raw = call_groq(FAST, system, user, 400)
    try:
        return json.loads(raw)
    except Exception:
        return {"approved": [], "rejected": [], "verdict": "FAIL"}


def agent_archivist(task: str, issues: list, mutations: list, score: int, verdict: str):
    """Agent 5: Persist lessons, errors, patterns."""
    if not issues and score >= 85:
        return  # Nothing meaningful to archive

    system = (
        "You are an archivist agent. Extract durable rules from this task review. "
        "Respond ONLY in JSON: {\"lessons\": [str], \"patterns\": [str]}"
    )
    user = (
        f"Task: {task}\nScore: {score}\nIssues: {json.dumps(issues)}\nVerdict: {verdict}\n\n"
        "Write max 3 LESSON: rules and 1 PATTERN: rule. Be concise."
    )
    raw = call_groq(PRIMARY, system, user, 400)
    try:
        data = json.loads(raw)
    except Exception:
        data = {"lessons": [raw], "patterns": []}

    timestamp = datetime.now().strftime("%Y-%m-%d")

    # Append to local tasks/lessons.md
    LESSONS_LOCAL.parent.mkdir(exist_ok=True)
    with open(LESSONS_LOCAL, "a") as f:
        for lesson in data.get("lessons", []):
            f.write(f"\n- [{timestamp}] LESSON: {lesson}")
        for pattern in data.get("patterns", []):
            f.write(f"\n- [{timestamp}] PATTERN: {pattern}")

    # Append to global ~/.agent-loop/lessons.md
    LESSONS_GLOBAL.parent.mkdir(parents=True, exist_ok=True)
    with open(LESSONS_GLOBAL, "a") as f:
        for lesson in data.get("lessons", []):
            f.write(f"\n- [{timestamp}][EstimaPro] LESSON: {lesson}")

    # Append HIGH issues to error-patterns.md
    ERRORS_LOCAL.parent.mkdir(exist_ok=True)
    high_issues = [i for i in issues if i.get("severity") == "HIGH"]
    if high_issues:
        with open(ERRORS_LOCAL, "a") as f:
            for issue in high_issues:
                f.write(
                    f"\n| `{issue['issue'][:60]}` | {issue.get('file', '?')} "
                    f"| auto-detected | {timestamp} |"
                )


def write_log(task: str, score: int, issues: list, mutations: list, verdict: str, summary: str):
    """Write human-readable log to tasks/loop-log.md."""
    LOG_FILE.parent.mkdir(exist_ok=True)
    with open(LOG_FILE, "a") as f:
        f.write(f"\n\n---\n## [{datetime.now().strftime('%Y-%m-%d %H:%M')}] {task[:80]}\n")
        f.write(f"**Score:** {score}/100 | **Verdict:** {verdict}\n")
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
        console.print("[yellow]⚠️  GROQ_API_KEY not set — post-task loop skipped.[/yellow]")
        return 0

    console.print(Panel(
        f"[bold cyan]🔄 Post-Task Loop — EvoAgentX Style[/bold cyan]\n{task[:100]}"
    ))

    # Agent 1 — Evaluate
    console.print("[dim]Agent 1/5: Evaluating...[/dim]")
    eval_result = agent_evaluator(task, output)
    score   = eval_result.get("score", 0)
    summary = eval_result.get("summary", "")
    console.print(f"  Score: [bold]{score}/100[/bold] — {summary}")

    # Agent 2 — Critique
    console.print("[dim]Agent 2/5: Critiquing...[/dim]")
    issues = agent_critic(task, output, score)
    high   = [i for i in issues if i.get("severity") == "HIGH"]
    console.print(f"  Issues: {len(issues)} total, {len(high)} HIGH severity")

    # Agent 3 — Mutate
    console.print("[dim]Agent 3/5: Generating mutations...[/dim]")
    mutations = agent_mutator(issues, output)
    console.print(f"  Mutations proposed: {len(mutations)}")

    # Agent 4 — Validate
    console.print("[dim]Agent 4/5: Validating mutations...[/dim]")
    validation = agent_validator(mutations, task)
    verdict    = validation.get("verdict", "UNKNOWN")
    approved   = validation.get("approved", [])
    console.print(f"  Verdict: [bold]{verdict}[/bold] | Approved: {len(approved)}")

    # Agent 5 — Archive
    console.print("[dim]Agent 5/5: Archiving lessons...[/dim]")
    agent_archivist(task, issues, approved, score, verdict)

    # Write human-readable log
    write_log(task, score, issues, mutations, verdict, summary)

    # JSON output to stdout for agent consumption
    result = {
        "score": score,
        "verdict": verdict,
        "issues": len(issues),
        "high_issues": len(high),
        "mutations_approved": len(approved)
    }
    print(json.dumps(result))

    if len(high) > 0:
        console.print(
            f"[bold red]⚠️  {len(high)} HIGH severity issues found — review tasks/loop-log.md[/bold red]"
        )
        return 1  # Non-blocking warning (agent can still proceed)

    console.print("[bold green]✅ Post-task loop complete.[/bold green]")
    return 0


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
