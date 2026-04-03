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
LOCK_TTL_DAYS = 7
HUMAN_GATE_SEVERITY = "HIGH"
PENDING_APPROVALS_FILE = Path(".agent/pending-approvals.md")
_SESSION_TOTAL_TOKENS = 0

ALERT_RULES = [
    {"key": "score_drop",      "condition": "avg_delta < -5",    "message": "SCORE DROP: avg fell >5pts over last 10 runs"},
    {"key": "regressions",     "condition": "regression_count >= 2", "message": "REGRESSIONS: 2+ skill regressions in last 10 runs"},
    {"key": "fallback_rate",   "condition": "fallback_pct > 50", "message": "MODEL HEALTH: >50% of calls hitting fallback models"},
    {"key": "evolution_stall", "condition": "evolutions_this_period == 0 and run_counter > 20",
                                            "message": "STALLED: no skills evolved in last 20 runs"},
]
MAX_SKILL_VERSIONS = 10

POPULATION_SIZE = 3          # candidates generated per evolution
TOURNAMENT_RUNS = 3          # tasks each candidate is tested on
POPULATION_DIR = Path(".agent/skills/.population")
PLATEAU_THRESHOLD = 8        # runs stuck below convergence before population kicks in
PLATEAU_SCORE_FLOOR = 92     # convergence target

MODEL_FALLBACK_CHAIN = {
    "primary": ["llama-3.3-70b-versatile", "llama-3.1-70b-versatile"],
    "fast": ["llama-3.1-8b-instant"]
}

TOP_K_LESSONS = 5
MAX_CONTEXT_LESSONS = 10
ABSTRACTION_THRESHOLD = 3
CALIBRATION_INTERVAL = 30

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
                content = path.read_text(encoding="utf-8", errors="replace")
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


def parse_lessons_from_file(path: Path) -> list[dict]:
    """Extract LESSON: and META_RULE: blocks as structured dicts (SEA Step 3 & 4)."""
    if not path.exists(): return []
    content = path.read_text(encoding="utf-8", errors="replace")
    # Match both LESSON: and META_RULE:
    blocks = re.findall(r'---\n(LESSON|META_RULE):\n(.*?)\n---', content, re.DOTALL)
    parsed = []
    for type_name, b in blocks:
        entry = {"type": type_name}
        for line in b.splitlines():
            if ":" in line:
                k, v = line.split(":", 1)
                entry[k.strip()] = v.strip()
        if entry: parsed.append({"raw": f"---\n{type_name}:\n{b.strip()}\n---", "data": entry})
    return parsed

def retrieve_relevant_lessons(query: str, top_k: int = TOP_K_LESSONS) -> str:
    """Keyword-based Top-K retrieval of lessons (SEA Step 3)."""
    all_lessons = []
    for path in [LESSONS_GLOBAL, LESSONS_LOCAL]:
        all_lessons.extend(parse_lessons_from_file(path))
    
    if not all_lessons: return "No relevant lessons found."
    
    query_words = set(re.findall(r"\w+", query.lower()))
    scored = []
    for lesson in all_lessons:
        # Match against pattern (LESSON) or rule (META_RULE)
        text_to_match = lesson["data"].get("pattern", "") or lesson["data"].get("rule", "")
        lesson_words = set(re.findall(r"\w+", text_to_match.lower()))
        overlap = len(query_words.intersection(lesson_words))
        
        # Boost HIGH severity
        if lesson["data"].get("severity") == "HIGH": overlap += 2
        # SEA Step 4: Prioritize META_RULEs
        if lesson["data"].get("type") == "META_RULE": overlap += 5
        
        scored.append((overlap, lesson["raw"]))
    
    scored.sort(key=lambda x: x[0], reverse=True)
    top_lessons = [x[1] for x in scored[:top_k] if x[0] > 0]
    
    if not top_lessons:
        # Fallback to recent HIGH/MED if no keyword overlap
        fallback = [l["raw"] for l in all_lessons if l["data"].get("severity") in ["HIGH", "MED"]]
        top_lessons = fallback[:top_k]

    return "\n\n".join(top_lessons) if top_lessons else "No relevant lessons found."

def call_groq(role: str, system: str, user: str, max_tokens: int = 800, json_mode: bool = False, query: str = None) -> str:
    """Wrapper for groq_call_with_fallback with semantic memory injection."""
    if not GROQ_API_KEY: return "SKIP: No GROQ_API_KEY set."
    
    if query:
        memory_context = retrieve_relevant_lessons(query)
    else:
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
        global _SESSION_TOTAL_TOKENS
        if hasattr(resp, "usage") and resp.usage:
            _SESSION_TOTAL_TOKENS += resp.usage.total_tokens
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
    raw = call_groq("primary", system, user, 300, json_mode=True, query=task)
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
    raw = call_groq("primary", system, user, 600, json_mode=True, query=task)
    try:
        res = json.loads(raw)
        if isinstance(res, dict) and "issues" in res: return res["issues"]
        return res if isinstance(res, list) else []
    except Exception:
        return []


def agent_mutator(issues: list, output: str, task: str = "general") -> list:
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
    raw = call_groq("fast", system, user, 600, json_mode=True, query=task)
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
    raw = call_groq("fast", system, user, 400, json_mode=True, query=task)
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
    res = call_groq("fast", system, user, 100, query=task).lower()
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
    
    original_content = skill_path.read_text(encoding="utf-8", errors="replace")
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
    mutated = call_groq("fast", system, user, 2000, query=task)
    if mutated and not mutated.startswith("SKIP"):
        # Step 4: Human-in-the-Loop Gate
        if any(i.get("severity") == HUMAN_GATE_SEVERITY for i in issues):
            queue_for_human_approval(skill_name, original_content, mutated, f"{len(issues)} HIGH issues found")
            timestamp = datetime.now().strftime("%Y-%m-%d")
            _append_to_file(Path("tasks/loop-telemetry.md"), [f"EVOLUTION_GATED: skill={skill_name} awaiting_approval date={timestamp}"])
            print(f"LOOP: HIGH severity mutation queued for approval — see {PENDING_APPROVALS_FILE.name}")
            return

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
        lines = FITNESS_LOG.read_text(encoding="utf-8", errors="replace").splitlines()
    
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
    dest.write_text(path.read_text(encoding="utf-8", errors="replace"), encoding="utf-8")
    prune_skill_history(skill_name)
    return next_v

def prune_skill_history(skill_name: str, history_dir: str = ".agent/skills/.history") -> int:
    """Keep only the latest MAX_SKILL_VERSIONS for a skill."""
    path = Path(history_dir)
    if not path.exists(): return 0
    files = []
    for f in path.glob(f"{skill_name}.v*.md"):
        m = re.search(r"\.v(\d+)\.md", f.name)
        if m: files.append((int(m.group(1)), f))
    
    files.sort() # Sort by version number
    deleted = 0
    if len(files) > MAX_SKILL_VERSIONS:
        to_delete = len(files) - MAX_SKILL_VERSIONS
        for i in range(to_delete):
            try:
                os.remove(files[i][1])
                deleted += 1
            except Exception: pass
            
    if deleted > 0:
        _append_to_file(Path("tasks/loop-telemetry.md"), [f"HISTORY_PRUNED: skill={skill_name} deleted={deleted} date={datetime.now().strftime('%Y-%m-%d')}"])
    return deleted

def check_and_rollback_skill(skill_name: str) -> bool:
    """Rollback skill if regression detected in the last 3 runs."""
    if not FITNESS_LOG.exists(): return False
    history = []
    lines = FITNESS_LOG.read_text(encoding="utf-8", errors="replace").splitlines()
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
    for line in log_path.read_text(encoding="utf-8", errors="replace").splitlines():
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
    for line in FITNESS_LOG.read_text(encoding="utf-8", errors="replace").splitlines():
        m = re.search(rf"skill={skill_name}.*score=(\d+)", line)
        if m: scores.append(int(m.group(1)))
    if len(scores) < CONVERGENCE_STREAK: return False
    if all(s >= CONVERGENCE_THRESHOLD for s in scores[-CONVERGENCE_STREAK:]):
        _append_to_file(Path("tasks/loop-telemetry.md"), [f"CONVERGED: {skill_name} date={datetime.now().isoformat()}"])
        return True
    return False

def is_skill_plateaued(skill_name: str, fitness_log_lines: list[str]) -> bool:
    """Check if skill score has flattened below the floor (SEA Step 1)."""
    scores = []
    for line in fitness_log_lines:
        m = re.search(rf"FITNESS=\w+ skill={skill_name} .*? score=(\d+)", line)
        if m: scores.append(int(m.group(1)))
    
    if len(scores) < PLATEAU_THRESHOLD: return False
    window = scores[-PLATEAU_THRESHOLD:]
    if all(s < PLATEAU_SCORE_FLOOR for s in window) and (max(window) - min(window)) < 3:
        return True
    return False

def record_candidate_score(skill_name: str, candidate_id: str, score: int, run: int) -> None:
    """Log tournament performance to telemetry (SEA Step 1)."""
    date = datetime.now().isoformat()
    _append_to_file(Path("tasks/loop-telemetry.md"), [
        f"POPULATION_SCORE: skill={skill_name} candidate={candidate_id} "
        f"score={score} run={run}/{TOURNAMENT_RUNS} date={date}"
    ])

def generate_population(skill_name: str, champion_path: str, client) -> list[str]:
    """Generate 3 variant candidates for a skill (SEA Step 1)."""
    POPULATION_DIR.mkdir(parents=True, exist_ok=True)
    champion_path_obj = Path(champion_path)
    if not champion_path_obj.exists(): return []
    champ_prompt = champion_path_obj.read_text(encoding="utf-8", errors="replace")
    
    variations = [
        "Generate a more specific, concrete version of this prompt. Focus on tightening constraints and removing ambiguity.",
        "Generate a more flexible, exploratory version of this prompt. Relax rigid constraints, encourage broader reasoning paths.",
        "Generate a structurally different version that achieves the same goal via a different reasoning approach."
    ]
    ids = ["A", "B", "C"]
    paths = []
    for var, char in zip(variations, ids):
        system = f"You are a Prompt Engineer. {var}"
        user = f"Current SKILL.md for {skill_name}:\n{champ_prompt}\n\nOutput ONLY the complete updated SKILL.md file."
        try:
            resp = groq_call_with_fallback(client, [{"role": "system", "content": system}, {"role": "user", "content": user}], role="fast")
            mutated = resp.choices[0].message.content.strip()
            dest = POPULATION_DIR / f"{skill_name}.candidate-{char}.md"
            dest.write_text(mutated, encoding="utf-8")
            paths.append(str(dest))
        except Exception: pass
    return paths

def elect_champion(skill_name: str, champion_path: str) -> str | None:
    """Analyze tournament results and promote the best candidate (SEA Step 1)."""
    tele_path = Path("tasks/loop-telemetry.md")
    if not tele_path.exists(): return None
    
    # Parse telemetry for completed tournament scores (run=3)
    results = {} # {id: [scores]}
    for line in tele_path.read_text(encoding="utf-8", errors="replace").splitlines():
        if f"POPULATION_SCORE: skill={skill_name}" in line:
            m = re.search(r"candidate=(\w) score=(\d+)", line)
            if m:
                cid, s = m.group(1), int(m.group(2))
                results.setdefault(cid, []).append(s)
    
    if not results: return None
    avg_scores = {cid: sum(sc)/len(sc) for cid, sc in results.items() if len(sc) >= TOURNAMENT_RUNS}
    if not avg_scores: return None
    
    best_id = max(avg_scores, key=avg_scores.get)
    best_avg = avg_scores[best_id]
    
    # Get current champion avg (last 3 from fitness log)
    champ_scores = []
    if FITNESS_LOG.exists():
        for line in FITNESS_LOG.read_text(encoding="utf-8", errors="replace").splitlines():
            m = re.search(rf"skill={skill_name}.*?score=(\d+)", line)
            if m: champ_scores.append(int(m.group(1)))
    
    champ_avg = sum(champ_scores[-3:]) / len(champ_scores[-3:]) if len(champ_scores[-3:]) >= 3 else 0
    
    if best_avg > champ_avg + 2:
        winner_path = POPULATION_DIR / f"{skill_name}.candidate-{best_id}.md"
        if winner_path.exists():
            snapshot_skill(champion_path)
            tmp = Path(champion_path).with_suffix(".tmp")
            tmp.write_text(winner_path.read_text(encoding="utf-8", errors="replace"), encoding="utf-8")
            os.replace(tmp, champion_path)
            _append_to_file(tele_path, [f"CHAMPION_ELECTED: skill={skill_name} candidate={best_id} old_avg={champ_avg} new_avg={best_avg} date={datetime.now().isoformat()}"])
            # Cleanup
            for char in ["A", "B", "C"]:
                try:
                    (POPULATION_DIR / f"{skill_name}.candidate-{char}.md").unlink()
                except Exception:
                    pass
            return str(winner_path)
            
    # Always cleanup after 3 runs even if no election
    for char in ["A", "B", "C"]:
        try:
            (POPULATION_DIR / f"{skill_name}.candidate-{char}.md").unlink()
        except Exception:
            pass
    return None

    return None

def classify_task_type(task: str) -> str:
    """Categorize task for workflow analysis (SEA Step 2)."""
    t = task.lower()
    if any(w in t for w in ["estimate", "vote", "story", "point", "sprint"]): return "estimation"
    if any(w in t for w in ["login", "jwt", "token", "auth", "session"]): return "auth"
    if any(w in t for w in ["room", "create", "delete", "manage", "admin"]): return "admin"
    return "general"

def log_workflow_run(chain: str, task_type: str, score: int, token_count: int) -> None:
    """Log performance of an agent chain (SEA Step 2)."""
    log_path = Path("tasks/workflow-fitness-log.md")
    if not log_path.exists():
        log_path.write_text("# Workflow Fitness Log\n", encoding="utf-8")
    
    date = datetime.now().strftime("%Y-%m-%d")
    line = f"WORKFLOW_RUN: chain={chain} task_type={task_type} score={score} tokens={token_count} date={date}"
    _append_to_file(log_path, [line])

def analyze_workflow_fitness(log_path: Path, min_runs: int = 30) -> list[str]:
    """Identify efficiency opportunities in agent chains (SEA Step 2)."""
    if not log_path.exists(): return []
    content = log_path.read_text(encoding="utf-8", errors="replace")
    runs = []
    for line in content.splitlines():
        m = re.search(r"WORKFLOW_RUN: chain=(\S+) task_type=(\w+) score=(\d+) tokens=(\d+)", line)
        if m:
            runs.append({"chain": m.group(1), "type": m.group(2), "score": int(m.group(3)), "tokens": int(m.group(4))})
    
    if len(runs) < min_runs: return []
    
    # stats: {(chain, type): {"scores": [], "tokens": []}}
    stats = {}
    for r in runs:
        key = (r["chain"], r["type"])
        stats.setdefault(key, {"scores": [], "tokens": []})
        stats[key]["scores"].append(r["score"])
        stats[key]["tokens"].append(r["tokens"])
        
    suggestions = []
    # Compare shorter chains to full chain for each type
    full_chain = "evaluate→critic→mutate→validate→archive"
    task_types = set(r["type"] for r in runs)
    
    for t in task_types:
        full_key = (full_chain, t)
        if full_key not in stats: continue
        
        f_score = sum(stats[full_key]["scores"]) / len(stats[full_key]["scores"])
        f_tokens = sum(stats[full_key]["tokens"]) / len(stats[full_key]["tokens"])
        
        for (chain, ctype), cdata in stats.items():
            if ctype == t and chain != full_chain:
                c_score = sum(cdata["scores"]) / len(cdata["scores"])
                c_tokens = sum(cdata["tokens"]) / len(cdata["tokens"])
                
                if c_score >= f_score - 2 and c_tokens < f_tokens * 0.6:
                    pct = int((1 - (c_tokens / f_tokens)) * 100)
                    suggestions.append(f"SUGGEST: For task_type={t}, chain={chain} achieves score={c_score:.1f} vs {full_chain} score={f_score:.1f} using {pct}% fewer tokens")
    
    return suggestions

def count_lessons_in_file(path: Path, keyword: str) -> int:
    """Count lessons matching a skill or keyword (SEA Step 4)."""
    lessons = parse_lessons_from_file(path)
    count = 0
    k = keyword.lower()
    for l in lessons:
        if k in l["data"].get("skill", "").lower() or k in l["data"].get("pattern", "").lower():
            count += 1
    return count

def maybe_abstract_patterns(skill_name: str, client) -> None:
    """Synthesize a META_RULE if lessons plateau or repeat (SEA Step 4)."""
    count = count_lessons_in_file(LESSONS_LOCAL, skill_name)
    if count < ABSTRACTION_THRESHOLD: return
    
    # Check if already abstracted recently
    tele_content = Path("tasks/loop-telemetry.md").read_text(encoding="utf-8", errors="replace") if Path("tasks/loop-telemetry.md").exists() else ""
    if f"META_RULE_GENERATED: skill={skill_name}" in tele_content:
        # Only abstract every 5 new lessons
        already_gen = len(re.findall(f"META_RULE_GENERATED: skill={skill_name}", tele_content))
        if count < (already_gen * 5) + ABSTRACTION_THRESHOLD: return

    # Get the 3 most recent lessons for this skill
    lessons = [l for l in parse_lessons_from_file(LESSONS_LOCAL) if skill_name.lower() in l["data"].get("skill", "").lower()][-3:]
    lesson_text = "\n".join([l["raw"] for l in lessons])
    
    system = "You are a Meta-Learning Agent. Synthesize a single high-level META_RULE from these repeating patterns."
    user = (
        f"Skill: {skill_name}\nRecent Lessons:\n{lesson_text}\n\n"
        "Output ONLY the new rule as a single block:\n"
        "---\n"
        "META_RULE:\n"
        f"  skill: {skill_name}\n"
        "  rule: {the synthesized higher-level rule}\n"
        "  prevention: {how to avoid this across all related tasks}\n"
        "---\n"
    )
    try:
        resp = groq_call_with_fallback(client, [{"role": "system", "content": system}, {"role": "user", "content": user}], role="fast")
        meta_yaml = resp.choices[0].message.content.strip()
        if "META_RULE:" in meta_yaml:
            _append_to_file(LESSONS_GLOBAL, [meta_yaml])
            _append_to_file(Path("tasks/loop-telemetry.md"), [f"META_RULE_GENERATED: skill={skill_name} date={datetime.now().isoformat()}"])
            print(f"LOOP: synthesized META_RULE for {skill_name}")
    except Exception: pass

def maybe_run_calibration(client, run_count: int, evolved_system: str) -> None:
    """Audit the evolved evaluator against a static Gold Standard (SEA Step 5)."""
    if run_count % CALIBRATION_INTERVAL != 0: return

    gold_standard = (
        "You are the Ultimate Architect. Evaluate this task against 10 immutable principles:\n"
        "1. RBAC must be enforced on every state-changing route.\n"
        "2. All business logic belongs in server/src/modules/.\n"
        "3. Every database update must write to LOGAUDITORIA.\n"
        "4. No hardcoded secrets or API keys.\n"
        "5. Validated TDD matches LDR requirements.\n"
        "6. No tech-stack deviations (React 19, Vite 6).\n"
        "7. Atomic file operations with .tmp swap.\n"
        "8. Named exports only.\n"
        "9. Max function length 30 lines.\n"
        "10. JSDoc on all exported functions.\n"
        "Respond ONLY in JSON: {\"gold_score\": int}"
    )
    
    # We compare the evolved_system (context-heavy) vs gold_standard (static)
    # on a generic audit task or the current context
    user = "Audit the current system state for protocol drift."
    try:
        # We need a reference task/output to audit. 
        # For simplicity, we just audit the general ruleset.
        resp = groq_call_with_fallback(client, [{"role": "system", "content": gold_standard}, {"role": "user", "content": user}], role="primary")
        gold_data = json.loads(resp.choices[0].message.content.strip())
        gold_score = gold_data.get("gold_score", 0)
        
        # Log to telemetry
        _append_to_file(Path("tasks/loop-telemetry.md"), [f"CALIBRATION_RUN: gold_score={gold_score} run={run_count} date={datetime.now().isoformat()}"])
        
        # Drift check logic (SEA Step 5)
        # If the Ultimate Architect (Gold Standard) scores it significantly lower than our Evolved Evaluator, we have drift.
        # We'll compare it to a default benchmark or log the discrepancy for user review.
        if gold_score < 70:
             _append_to_file(Path("tasks/loop-telemetry.md"), [f"DRIFT_ALERT: Gold Standard principles scored current state at {gold_score}/100. Systemic drift detected. date={datetime.now().isoformat()}"])
             print(f"LOOP: !!! DRIFT ALERT !!! Gold Standard score: {gold_score}")
    except Exception: pass

def sweep_expired_locks(lock_dir: str = ".agent/loop-locks") -> int:
    """Scan and delete .lock files older than LOCK_TTL_DAYS."""
    path = Path(lock_dir)
    if not path.exists(): return 0
    now, deleted = time.time(), 0
    for f in path.glob("*.lock"):
        if os.stat(f).st_mtime < (now - LOCK_TTL_DAYS * 86400):
            try:
                os.remove(f)
                deleted += 1
            except Exception: pass
    return deleted

def load_skill_dependencies(path: str = ".agent/skill-dependencies.json") -> dict:
    """Read and parse skill dependencies from JSON."""
    p = Path(path)
    if not p.exists(): return {}
    try:
        return json.loads(p.read_text(encoding="utf-8", errors="replace"))
    except Exception: return {}

def get_blocked_skills(skills_queued_for_evolution: list[str], dependencies: dict) -> list[str]:
    """Identify skills that cannot evolve because their dependencies are also queued."""
    blocked = []
    for skill in skills_queued_for_evolution:
        deps = dependencies.get(skill, [])
        for dep in deps:
            if dep in skills_queued_for_evolution:
                blocked.append(skill)
                break
    return blocked

def maybe_remove_approval_block(skill: str):
    """Remove a REJECT block from the approvals file."""
    if not PENDING_APPROVALS_FILE.exists(): return
    content = PENDING_APPROVALS_FILE.read_text(encoding="utf-8", errors="replace")
    # Identify blocks (delimited by ## PENDING APPROVAL)
    parts = re.split(r"(## PENDING APPROVAL — .*?\n)", content)
    if not parts: return
    
    new_content = [parts[0]] # Text before first block
    for i in range(1, len(parts), 2):
        header = parts[i]
        body = parts[i+1]
        if f"skill: {skill}" not in body:
            new_content.append(header + body)
            
    tmp = PENDING_APPROVALS_FILE.with_suffix(".tmp")
    tmp.write_text("".join(new_content), encoding="utf-8")
    os.replace(tmp, PENDING_APPROVALS_FILE)

def topological_sort_skills(skills: list[str], dependencies: dict) -> list[str]:
    """Sort skills so dependencies evolve first."""
    sorted_skills = []
    visited, temp_visited = set(), set()
    def visit(node):
        if node in temp_visited: return # Cycle
        if node not in visited:
            temp_visited.add(node)
            for dep in dependencies.get(node, []):
                if dep in skills: visit(dep)
            temp_visited.remove(node)
            visited.add(node)
            sorted_skills.append(node)
    for s in skills: visit(s)
    return sorted_skills

def run_fixture_calibration(client, fixtures_dir: str, evaluator_system_prompt: str) -> dict:
    """Run Evaluator against golden fixtures to detect drift."""
    path = Path(fixtures_dir)
    if not path.exists(): return {"drift_detected": False}
    results = {"drift_detected": False}
    for f in path.glob("*.json"):
        try:
            fixture = json.loads(f.read_text(encoding="utf-8"))
            user = f"Task: {fixture['task']}\nOutput: {fixture['output']}\nScore 0-100."
            resp = groq_call_with_fallback(client, [{"role": "system", "content": evaluator_system_prompt}, {"role": "user", "content": user}], role="primary", max_tokens=100, response_format={"type": "json_object"})
            data = json.loads(resp.choices[0].message.content.strip())
            score = int(data.get("score", data.get("output_score", 0)))
            status = "PASS" if score >= fixture["expected_score_min"] else "DRIFT"
            if status == "DRIFT": results["drift_detected"] = True
            results[fixture["id"]] = {"score": score, "expected": fixture["expected_score_min"], "status": status}
        except Exception: pass
    return results

def maybe_run_calibration(client, run_counter: int, evaluator_system_prompt: str) -> None:
    """Every 20 runs, perform calibration and log alerts if drift detected."""
    if run_counter % 20 != 0: return
    res = run_fixture_calibration(client, "tasks/golden-fixtures", evaluator_system_prompt)
    telemetry_path = Path("tasks/loop-telemetry.md")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    for fid, data in res.items():
        if fid == "drift_detected": continue
        _append_to_file(telemetry_path, [f"CALIBRATION: fixture={fid} score={data['score']} expected_min={data['expected']} status={data['status']}"])
    if res.get("drift_detected"):
        _append_to_file(Path("tasks/loop-alerts.md"), [f"EVALUATOR_DRIFT: one or more fixtures scored below threshold date={timestamp} — manually review Evaluator system prompt"])
        print("LOOP WARNING: Evaluator drift detected — see tasks/loop-alerts.md")

def queue_for_human_approval(skill: str, old_prompt: str, new_prompt: str, reason: str) -> None:
    """Queue a HIGH severity mutation for manual approval."""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    block = [
        f"\n## PENDING APPROVAL — {timestamp}",
        f"skill: {skill}",
        f"reason: {reason}",
        "status: PENDING",
        "--- CURRENT PROMPT (first 400 chars) ---",
        f"{old_prompt[:400]}",
        "--- PROPOSED MUTATION (first 400 chars) ---",
        f"{new_prompt[:400]}",
        "---",
        "To APPROVE: delete this block entirely.",
        'To REJECT: replace "status: PENDING" with "status: REJECT" above.',
        "---\n"
    ]
    # Atomic write
    tmp = PENDING_APPROVALS_FILE.with_suffix(".tmp")
    if PENDING_APPROVALS_FILE.exists():
        tmp.write_text(PENDING_APPROVALS_FILE.read_text(encoding="utf-8") + "\n".join(block), encoding="utf-8")
    else:
        tmp.write_text("\n".join(block), encoding="utf-8")
    os.replace(tmp, PENDING_APPROVALS_FILE)

def check_pending_approvals() -> dict[str, str]:
    """Parse the approvals file and return state per skill."""
    if not PENDING_APPROVALS_FILE.exists(): return {}
    content = PENDING_APPROVALS_FILE.read_text(encoding="utf-8")
    results = {}
    blocks = re.split(r"## PENDING APPROVAL", content)
    for b in blocks:
        if not b.strip(): continue
        sm = re.search(r"skill: (\S+)", b)
        stm = re.search(r"status: (PENDING|REJECT)", b)
        if sm and stm:
            results[sm.group(1)] = stm.group(1)
    return results

def process_pending_approval(skill: str) -> bool:
    """Check if a skill is still waiting for approval."""
    approvals = check_pending_approvals()
    return approvals.get(skill) == "PENDING"

def evaluate_alert_rules(telemetry_data: dict) -> list[str]:
    """Evaluate monitoring rules against telemetry data."""
    triggered = []
    # Simple eval using eval() with telemetry_data as context
    # Note: run_counter is used in evolution_stall
    ctx = telemetry_data.copy()
    for rule in ALERT_RULES:
        try:
            # Replace key names with actual values if present in condition string
            cond = rule["condition"]
            if eval(cond, {"__builtins__": None}, ctx):
                triggered.append(rule["message"])
        except Exception: pass
    return triggered

def write_loop_alerts(alerts: list[str]) -> None:
    """Write triggered alerts to loop-alerts.md and stdout."""
    if not alerts: return
    alert_path = Path("tasks/loop-alerts.md")
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M")
    lines = [f"[{timestamp}] {a}" for a in alerts]
    _append_to_file(alert_path, lines)
    for a in alerts:
        print(f"LOOP ALERT: {a}")

def compute_telemetry_data(telemetry_path: str, run_counter: int) -> dict:
    """Parse logs to compute windowed health metrics."""
    data = {"fallback_pct": 0, "avg_delta": 0, "regression_count": 0, "evolutions_this_period": 0, "run_counter": run_counter}
    tp = Path(telemetry_path)
    if not tp.exists(): return data
    
    content = tp.read_text(encoding="utf-8")
    # 1. Fallback Rate (last 10 MODEL_HIT)
    hits = re.findall(r"MODEL_HIT: .*? role=(\w+)", content)
    if hits:
        window = hits[-10:]
        falls = [h for h in window if h != "primary"]
        data["fallback_pct"] = (len(falls) / len(window)) * 100
    
    # 2. Avg Score Delta (last 10 scores from fitness log)
    if FITNESS_LOG.exists():
        fitness_content = FITNESS_LOG.read_text(encoding="utf-8")
        scores = [int(s) for s in re.findall(r"score=(\d+)", fitness_content)]
        if len(scores) >= 10:
            last_5 = sum(scores[-5:]) / 5
            prev_5 = sum(scores[-10:-5:]) / 5
            data["avg_delta"] = last_5 - prev_5
            
        # 3. Regressions (ROLLBACK in last 10 runs)
        # We look for ROLLBACK in telemetry
        rollbacks = re.findall(r"ROLLBACK:", content)
        # This is a bit rough, but let's say ROLLBACK lines in the tail of telemetry
        data["regression_count"] = len(re.findall(r"ROLLBACK:", "\n".join(content.splitlines()[-50:])))

    # 4. Evolutions (### [EVOLUTION] in last 20 runs)
    if LOG_FILE.exists():
        log_content = LOG_FILE.read_text(encoding="utf-8")
        data["evolutions_this_period"] = len(re.findall(r"### \[EVOLUTION\]", "\n".join(log_content.splitlines()[-100:])))
    
    return data

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
    
    if count % 10 == 0:
        tele_data = compute_telemetry_data(str(telemetry_path), count)
        alerts = evaluate_alert_rules(tele_data)
        write_loop_alerts(alerts)
        
        # Log Memory Index (SEA Step 3)
        lesson_count = len(parse_lessons_from_file(LESSONS_GLOBAL)) + len(parse_lessons_from_file(LESSONS_LOCAL))
        _append_to_file(telemetry_path, [f"MEMORY_INDEX: total_lessons={lesson_count} date={datetime.now().isoformat()}"])

    if count % 30 == 0:
        suggestions = analyze_workflow_fitness(Path("tasks/workflow-fitness-log.md"))
        if suggestions:
            date = datetime.now().strftime("%Y-%m-%d")
            lines = [f"WORKFLOW_SUGGESTION: {s} date={date}" for s in suggestions]
            _append_to_file(telemetry_path, lines)

    if count % 50 == 0:
        deleted_count = sweep_expired_locks()
        timestamp = datetime.now().strftime("%Y-%m-%d")
        _append_to_file(telemetry_path, [f"LOCK_SWEEP: deleted={deleted_count} date={timestamp}"])

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
    skill_name = identify_responsible_skill(task, issues)
    if skill_name:
        update_fitness_log(skill_name, score)
        curr_v = get_skill_version(skill_name)
        update_fitness_log_raw(skill_name, score, evolved_from=curr_v)

    # Step 2: Multi-skill evolved with dependencies
    deps = load_skill_dependencies()
    skills_to_evolve = get_actionable_low_fitness_skills(FITNESS_LOG)
    
    # SEA Step 1: Population Gating
    fitness_lines = FITNESS_LOG.read_text(encoding="utf-8").splitlines() if FITNESS_LOG.exists() else []
    if skill_name and is_skill_plateaued(skill_name, fitness_lines):
        candidates = list(POPULATION_DIR.glob(f"{skill_name}.candidate-*.md"))
        if not candidates:
            client = Groq(api_key=GROQ_API_KEY)
            generate_population(skill_name, f".agent/skills/{skill_name}/SKILL.md", client)
            print(f"LOOP: {skill_name} plateaued — spawning population of 3 candidates")
        else:
            # Tournament in progress. Find candidate with least runs.
            tele_content = Path("tasks/loop-telemetry.md").read_text(encoding="utf-8") if Path("tasks/loop-telemetry.md").exists() else ""
            counts = {"A": 0, "B": 0, "C": 0}
            for char in counts:
                counts[char] = len(re.findall(rf"POPULATION_SCORE: skill={skill_name} candidate={char}", tele_content))
            
            # Find candidate that hasn't finished TOURNAMENT_RUNS
            current_cand = None
            for char in ["A", "B", "C"]:
                if counts[char] < TOURNAMENT_RUNS:
                    current_cand = char
                    break
            
            if current_cand:
                record_candidate_score(skill_name, current_cand, score, counts[current_cand] + 1)
                # Check if this was the last run of the last candidate
                if current_cand == "C" and counts["C"] + 1 == TOURNAMENT_RUNS:
                    elect_champion(skill_name, f".agent/skills/{skill_name}/SKILL.md")
                # Do NOT evolve the base skill yet
                skill_name = None 

    high_issues = [i for i in issues if i.get("severity") == "HIGH"]
    if skill_name and high_issues and not is_skill_converged(skill_name) and skill_name not in skills_to_evolve:
        skills_to_evolve.append(skill_name)

    blocked_skills = get_blocked_skills(skills_to_evolve, deps)
    for s in blocked_skills:
        # Log defferred
        for dep in deps.get(s, []):
            if dep in skills_to_evolve:
                timestamp = datetime.now().strftime("%Y-%m-%d")
                _append_to_file(Path("tasks/loop-telemetry.md"), [f"EVOLUTION_DEFERRED: skill={s} blocked_by={dep} date={timestamp}"])
                break
    
    executable_skills = [s for s in skills_to_evolve if s not in blocked_skills]
    
    # Step 4: Human Gate checks
    approvals = check_pending_approvals()
    final_skills = []
    for s in executable_skills:
        status = approvals.get(s)
        if status == "REJECT":
            timestamp = datetime.now().strftime("%Y-%m-%d")
            _append_to_file(Path("tasks/loop-telemetry.md"), [f"EVOLUTION_REJECTED: skill={s} date={timestamp}"])
            maybe_remove_approval_block(s)
            continue
        if status == "PENDING":
            # Already queued, wait
            continue
        final_skills.append(s)

    ordered_skills = topological_sort_skills(final_skills, deps)
    
    for s in ordered_skills:
        evolve_skill_prompt(s, issues if s == skill_name else [], task)

    # Persist structured YAML (Step 2)
    raw_yaml = call_groq("primary", system, user, 800, query=task)
    if raw_yaml and "LESSON:" in raw_yaml:
        _append_to_file(LESSONS_LOCAL, [raw_yaml])
        # Also append to global context for cross-project learning
        global_entry = f"[EstimaPro]\n{raw_yaml}"
        _append_to_file(LESSONS_GLOBAL, [global_entry])
        
        # Step 4: Meta-Learning
        if skill_name:
            client = Groq(api_key=GROQ_API_KEY)
            maybe_abstract_patterns(skill_name, client)
    
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
    global _SESSION_TOTAL_TOKENS
    _SESSION_TOTAL_TOKENS = 0
    if not GROQ_API_KEY:
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

    # Step 3: Drift Detection
    counter_path = Path(".agent/loop-run-counter.txt")
    run_count = int(counter_path.read_text(encoding="utf-8").strip()) if counter_path.exists() else 0
    client = Groq(api_key=GROQ_API_KEY)
    evaluator_system = (
        f"You are a senior auditor for EstimaPro.\n{PROJECT_RULES}\n"
        "Respond ONLY in JSON: {\"output_score\": int, \"protocol_score\": int, \"summary\": str}"
    )
    maybe_run_calibration(client, run_count, evaluator_system)

    chain = "evaluate→archive"
    issues, muts, val = [], [], {}
    verdict, approved = "PASS", []

    # 2. Critique
    if score < 92:
        chain = "evaluate→critic→archive"
        console.print("[dim]Agent 2/5: Critiquing...[/dim]")
        issues = agent_critic(task, output, score)
        if not isinstance(issues, list): issues = []
        issues = [i for i in issues if isinstance(i, dict)]
        high = [i for i in issues if i.get("severity") == "HIGH"]
        console.print(f"  Issues: {len(issues)} total, {len(high)} HIGH")

        # 3. Mutate & Validate
        if score < 80 and issues:
            chain = "evaluate→critic→mutate→validate→archive"
            console.print("[dim]Agent 3/5 & 4/5: Mutating & Validating...[/dim]")
            muts = agent_mutator(issues, output, task=task)
            val = agent_validator(muts, task)
            verdict, approved = val.get("verdict", "UNKNOWN"), val.get("approved", [])
            console.print(f"  Verdict: [bold]{verdict}[/bold] | Approved: {len(approved)}")

    # 4. Archive & Evolve (Agent 5)
    console.print("[dim]Agent 5/5: Archiving & Evolving...[/dim]")
    agent_archivist(task, issues, approved, score, verdict, task_hash=task_hash)
    
    # Workflow logging
    t_type = classify_task_type(task)
    log_workflow_run(chain, t_type, score, _SESSION_TOTAL_TOKENS)

    write_log(task, score, out_s, pro_s, issues, muts, verdict, summ)

    # Step 7: Telemetry summary
    maybe_emit_telemetry_report(Path("tasks/loop-telemetry.md"))

    high_count = len([i for i in issues if i.get("severity") == "HIGH"])
    print(json.dumps({
        "score": score, 
        "output_score": out_s,
        "protocol_score": pro_s,
        "verdict": verdict, 
        "issues": len(issues), 
        "high_issues": high_count
    }))
    return 1 if high_count else 0


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
