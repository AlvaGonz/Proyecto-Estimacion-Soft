"""
post_task_loop.py — EstimaPro EvoAgentX-style Post-Task Loop
Runs automatically after every agent task. Chains 5 Groq agents.
Usage: python scripts/post_task_loop.py --task "description" --output "what was produced"
"""
import os, sys, json, argparse, difflib, hashlib, re, shutil
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from groq import Groq, RateLimitError, APIStatusError
from rich.console import Console
from rich.panel import Panel

load_dotenv()
console = Console()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
LESSONS_LOCAL  = Path("tasks/lessons.md")
ERRORS_LOCAL   = Path("tasks/error-patterns.md")
LOG_FILE       = Path("tasks/loop-log.md")
FITNESS_LOG    = Path("tasks/skill-fitness-log.md")
LESSONS_GLOBAL = Path.home() / ".agent-loop" / "lessons.md"
RECENCY_WINDOW_DAYS = 14
CONVERGENCE_THRESHOLD = 90
CONVERGENCE_STREAK = 5

MODEL_FALLBACK_CHAIN = {
    "primary": ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile", "mixtral-8x7b-32768"],
    "fast": ["llama-3.1-8b-instant", "gemma2-9b-it"]
}

def groq_call_with_fallback(client, messages: list, role: str = "primary", **kwargs) -> object:
    """Execute Groq call with tiered fallback and telemetry logging."""
    models = MODEL_FALLBACK_CHAIN.get(role, MODEL_FALLBACK_CHAIN["fast"])
    last_err = None
    for model in models:
        try:
            resp = client.chat.completions.create(model=model, messages=messages, **kwargs)
            # Log success to telemetry
            telemetry_path = Path("tasks/loop-telemetry.md")
            _append_to_file(telemetry_path, [f"MODEL_HIT: {model} role={role} date={datetime.now().isoformat()}"])
            return resp
        except (RateLimitError, APIStatusError) as e:
            last_err = e
            console.print(f"[yellow]Fallback: {model} failed ({type(e).__name__}).[/yellow]")
            continue
    raise RuntimeError(f"All Groq models exhausted — loop aborted gracefully. Last error: {last_err}")

def get_task_hash(task: str, output: str) -> str:
    """Generate a 12-char SHA-256 hash of task and output."""
    return hashlib.sha256(f"{task}:{output}".encode("utf-8")).hexdigest()[:12]

def is_already_processed(task_hash: str) -> bool:
    """Check if task hash is already processed via lock file."""
    lock_dir = Path(".agent/loop-locks")
    lock_file = lock_dir / f"{task_hash}.lock"
    if lock_file.exists():
        return True
    
    lock_dir.mkdir(parents=True, exist_ok=True)
    temp_file = lock_file.with_suffix(".tmp")
    temp_file.write_text(f"processed {datetime.now().isoformat()}", encoding="utf-8")
    os.replace(temp_file, lock_file)
    return False

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
    """Read local and global lessons to inject context (HIGH/MED only)."""
    memory_blocks = []
    for path in [LESSONS_GLOBAL, LESSONS_LOCAL]:
        if path.exists():
            try:
                content = path.read_text(encoding="utf-8")
                # Step 2: Parse blocks using regex
                blocks = re.findall(r'---\nLESSON:\n(.*?)\n---', content, re.DOTALL)
                for block in blocks:
                    # Filter for HIGH or MED severity
                    if 'severity: HIGH' in block or 'severity: MED' in block:
                        memory_blocks.append(f"---\nLESSON:\n{block.strip()}\n---")
            except Exception:
                pass
    
    if not memory_blocks:
        return "No previous session memory found."
    
    return "\n\n".join(memory_blocks)


def call_groq(role: str, system: str, user: str, max_tokens: int = 800, json_mode: bool = False) -> str:
    """Wrapper for groq_call_with_fallback with memory injection."""
    if not GROQ_API_KEY: return "SKIP: No GROQ_API_KEY set."
    memory_context = get_session_memory()
    enriched_system = f"{system}\n\n[SESSION_MEMORY_INSIGHTS]\n{memory_context}"
    client = Groq(api_key=GROQ_API_KEY)
    kwargs = {"max_tokens": max_tokens, "temperature": 0.1}
    if json_mode: kwargs["response_format"] = {"type": "json_object"}
    try:
        resp = groq_call_with_fallback(client, [
            {"role": "system", "content": enriched_system},
            {"role": "user",   "content": user}
        ], role=role, **kwargs)
        return resp.choices[0].message.content.strip()
    except RuntimeError as e:
        console.print(f"[red]{str(e)}[/red]")
        sys.exit(0) # Abort gracefully per requirements


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
    raw = call_groq("primary", system, user, 300, json_mode=True)
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
    raw = call_groq("primary", system, user, 600, json_mode=True)
    try:
        res = json.loads(raw)
        if isinstance(res, dict) and "issues" in res: return res["issues"]
        return res if isinstance(res, list) else []
    except Exception:
        return []


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
    raw = call_groq("fast", system, user, 600, json_mode=True)
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
    raw = call_groq("fast", system, user, 400, json_mode=True)
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
    res = call_groq("fast", system, user, 100).lower()
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
    mutated = call_groq("fast", system, user, 2000)
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
        
        # Step 5: Snapshot before mutation
        version = snapshot_skill(str(skill_path))
        
        skill_path.write_text(mutated, encoding="utf-8")
        console.print(f"  [bold green]EVOLVED:[/bold green] {skill_name} to {version}")
        
        # Log the evolution event
        evolve_log = [
            f"### [EVOLUTION] Skill: {skill_name} @ {version}",
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
    return label # Return label for use in loop

def update_fitness_log_raw(skill_name: str, score: int, evolved_from: str = "null"):
    """Append raw fitness line for TTL and regression tracking."""
    timestamp = datetime.now().strftime("%Y-%m-%d")
    label = "HIGH" if score >= 85 else ("MED" if score >= 60 else "LOW")
    raw_line = f"FITNESS={label} skill={skill_name} date={timestamp} score={score} evolved_from={evolved_from}"
    _append_to_file(FITNESS_LOG, [raw_line])

def get_skill_version(skill_name: str) -> str:
    """Detect current max version from history."""
    history_dir = Path(".agent/skills/.history")
    if not history_dir.exists(): return "v0"
    existing = list(history_dir.glob(f"{skill_name}.v*.md"))
    v_nums = [int(re.search(r"\.v(\d+)\.md", f.name).group(1)) for f in existing if re.search(r"\.v(\d+)\.md", f.name)]
    return f"v{max(v_nums)}" if v_nums else "v0"

def snapshot_skill(skill_path: str) -> str:
    """Snapshot current skill to version history before mutation."""
    path = Path(skill_path)
    if not path.exists(): return ""
    skill_name = path.parent.name
    history_dir = Path(".agent/skills/.history")
    history_dir.mkdir(parents=True, exist_ok=True)
    curr_v = get_skill_version(skill_name)
    next_v = f"v{int(curr_v[1:]) + 1}"
    dest = history_dir / f"{skill_name}.{next_v}.md"
    dest.write_text(path.read_text(encoding="utf-8"), encoding="utf-8")
    return next_v

def check_and_rollback_skill(skill_name: str) -> bool:
    """Rollback skill if regression detected in the last 3 runs."""
    if not FITNESS_LOG.exists(): return False
    history = []
    lines = FITNESS_LOG.read_text(encoding="utf-8").splitlines()
    for line in lines:
        m = re.search(rf"FITNESS=\w+ skill={skill_name} date=[\d-]+ score=(\d+) evolved_from=(\S+)", line)
        if m: history.append({"score": int(m.group(1)), "v": m.group(2)})
    if len(history) < 3: return False
    last_3_avg = sum(h["score"] for h in history[-3:]) / 3
    last_v = history[-1]["v"]
    if last_v == "null" or last_v == "v0": return False
    prev_scores = [h["score"] for h in history if h["v"] != last_v and h["v"] != "null"]
    if not prev_scores: return False
    prev_avg = sum(prev_scores[-5:]) / len(prev_scores[-5:])
    if last_3_avg < prev_avg - 5:
        history_path = Path(f".agent/skills/.history/{skill_name}.v0.md") # Simple rollback for now
        # Find the specific previous version for more precision
        v_num = int(last_v[1:])
        prev_v_path = Path(f".agent/skills/.history/{skill_name}.v{v_num-1}.md")
        if prev_v_path.exists():
            shutil.copy(prev_v_path, Path(f".agent/skills/{skill_name}/SKILL.md"))
            _append_to_file(Path("tasks/loop-telemetry.md"), [f"ROLLBACK: {skill_name} {last_v}->v{v_num-1} reason=regression date={datetime.now().isoformat()}"])
            return True
    return False

def get_actionable_low_fitness_skills(log_path: Path) -> list[str]:
    """Return unique skills with LOW fitness in the last 14 days."""
    if not log_path.exists():
        return []
    today = datetime.now().date()
    low_skills = set()
    for line in log_path.read_text(encoding="utf-8").splitlines():
        match = re.search(r"FITNESS=LOW skill=(\S+) date=(\d{4}-\d{2}-\d{2})", line)
        if match:
            skill, date_str = match.group(1), match.group(2)
            try:
                dt = datetime.strptime(date_str, "%Y-%m-%d").date()
                if (today - dt).days <= RECENCY_WINDOW_DAYS:
                    low_skills.add(skill)
            except ValueError: continue
    return list(low_skills)

def is_skill_converged(skill_name: str) -> bool:
    """Check if skill has consistently high scores (>= 90 x 5)."""
    if not FITNESS_LOG.exists(): return False
    scores = []
    for line in FITNESS_LOG.read_text(encoding="utf-8").splitlines():
        m = re.search(rf"skill={skill_name}.*score=(\d+)", line)
        if m: scores.append(int(m.group(1)))
    if len(scores) < CONVERGENCE_STREAK: return False
    if all(s >= CONVERGENCE_THRESHOLD for s in scores[-CONVERGENCE_STREAK:]):
        _append_to_file(Path("tasks/loop-telemetry.md"), [f"CONVERGED: {skill_name} date={datetime.now().isoformat()}"])
        return True
    return False

def maybe_emit_telemetry_report(telemetry_path: Path):
    """Every 10 runs, emit a summary health report to telemetry."""
    counter_path = Path(".agent/loop-run-counter.txt")
    counter_path.parent.mkdir(parents=True, exist_ok=True)
    count = int(counter_path.read_text(encoding="utf-8").strip()) if counter_path.exists() else 0
    count += 1
    counter_path.write_text(str(count), encoding="utf-8")
    if count % 10 == 0:
        log_content = telemetry_path.read_text(encoding="utf-8") if telemetry_path.exists() else ""
        hits, rollbacks, convergences = len(re.findall(r"MODEL_HIT", log_content)), len(re.findall(r"ROLLBACK", log_content)), len(re.findall(r"CONVERGED", log_content))
        evolutions = len(re.findall(r"### \[EVOLUTION\]", LOG_FILE.read_text(encoding="utf-8"))) if LOG_FILE.exists() else 0
        report = [
            "\n" + "="*40, f"LOOP TELEMETRY REPORT — Run #{count}",
            f"Date: {datetime.now().isoformat()}", "-"*40,
            f"Total Model Hits: {hits}", f"Total Evolutions: {evolutions}",
            f"Total Rollbacks:  {rollbacks}", f"Converged Skills: {convergences}", "="*40 + "\n"
        ]
        _append_to_file(telemetry_path, report)

def archive_stale_fitness_entries(log_path: Path, archive_path: Path):
    """Move entries older than RECENCY_WINDOW_DAYS to archive atomically."""
    if not log_path.exists(): return
    today, keep, stale = datetime.now().date(), [], []
    for line in log_path.read_text(encoding="utf-8").splitlines():
        match = re.search(r"date=(\d{4}-\d{2}-\d{2})", line)
        if match:
            try:
                dt = datetime.strptime(match.group(1), "%Y-%m-%d").date()
                if (today - dt).days > RECENCY_WINDOW_DAYS:
                    stale.append(line)
                    continue
            except ValueError: pass
        keep.append(line)
    if stale:
        # Atomic append to archive
        with open(archive_path.with_suffix(".tmp"), "w", encoding="utf-8") as f:
            if archive_path.exists(): f.write(archive_path.read_text(encoding="utf-8"))
            for line in stale: f.write(line + "\n")
        os.replace(archive_path.with_suffix(".tmp"), archive_path)
        # Atomic write back to log
        log_path.with_suffix(".tmp").write_text("\n".join(keep) + "\n", encoding="utf-8")
        os.replace(log_path.with_suffix(".tmp"), log_path)

def agent_archivist(task: str, issues: list, mutations: list, score: int, verdict: str, task_hash: str = "unknown"):
    """Agent 5: Persist lessons using structured YAML schema."""
    system = (
        "You are an Archivist agent. Your goal is to extract long-term lessons and error patterns.\n"
        "OUTPUT FORMAT — STRICT. No freeform prose. Every entry MUST use this\n"
        "YAML front-matter schema. Emit one block per lesson:\n\n"
        "---\n"
        "LESSON:\n"
        f"  task_hash: {task_hash}\n"
        "  skill: {skill_name_or_\"general\"}\n"
        "  pattern: {one sentence, max 120 chars, actionable}\n"
        "  severity: {HIGH|MED|LOW}\n"
        "  date: {YYYY-MM-DD}\n"
        "  evolved_from: {vN|null}\n"
        "---\n\n"
        "Do NOT write anything outside these blocks. No headings, no summaries."
    )
    user = f"Task: {task}\nScore: {score}\nIssues: {json.dumps(issues)}\nVerdict: {verdict}"
    
    # Identify and Evolve (Step 1 & 2 logic)
    high_issues = [i for i in issues if i.get("severity") == "HIGH"]
    skill_name = identify_responsible_skill(task, issues)
    if skill_name:
        update_fitness_log(skill_name, score)
        curr_v = get_skill_version(skill_name)
        update_fitness_log_raw(skill_name, score, evolved_from=curr_v)
        if high_issues:
            if not is_skill_converged(skill_name):
                evolve_skill_prompt(skill_name, issues, task)
            else:
                console.print(f"  [bold blue]CONVERGED:[/bold blue] {skill_name} mutation suppressed.")

    # Persist structured YAML (Step 2)
    raw_yaml = call_groq("primary", system, user, 800)
    if raw_yaml and "LESSON:" in raw_yaml:
        _append_to_file(LESSONS_LOCAL, [raw_yaml])
        # Also append to global context for cross-project learning
        global_entry = f"[EstimaPro]\n{raw_yaml}"
        _append_to_file(LESSONS_GLOBAL, [global_entry])
    
    if high_issues:
        timestamp = datetime.now().strftime("%Y-%m-%d")
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
    """Main loop entry point with idempotency guard."""
    if not GROQ_API_KEY:
        # Exit 0 silently on missing key per requirements
        return 0

    task_hash = get_task_hash(task, output)
    if is_already_processed(task_hash):
        print(f"LOOP: skipping duplicate task_hash={task_hash}")
        return 0

    # Step 3: Archive stale fitness entries once at startup
    archive_stale_fitness_entries(FITNESS_LOG, Path("tasks/skill-fitness-archive.md"))

    # Step 5: Check and rollback regressions for recently evolved skills
    os.makedirs(".agent/skills/.history", exist_ok=True)
    # Scan log for skills seen in the last 3 runs
    log_content = FITNESS_LOG.read_text(encoding="utf-8") if FITNESS_LOG.exists() else ""
    recent_skills = set(re.findall(r"skill=(\S+)", "\n".join(log_content.splitlines()[-10:])))
    for s in recent_skills:
        check_and_rollback_skill(s)

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
    if not isinstance(issues, list): issues = []
    issues = [i for i in issues if isinstance(i, dict)]
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
    agent_archivist(task, issues, approved, score, verdict, task_hash=task_hash)
    write_log(task, score, out_s, pro_s, issues, muts, verdict, summ)

    # Step 7: Telemetry summary
    maybe_emit_telemetry_report(Path("tasks/loop-telemetry.md"))

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
