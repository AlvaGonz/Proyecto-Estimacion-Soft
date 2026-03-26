import os
import json
import subprocess
from datetime import datetime

# Paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_RESULTS_DIR = os.path.join(ROOT_DIR, "test-results")
GATE_STATUS_FILE = os.path.join(TEST_RESULTS_DIR, "gate_status.txt")
PROPOSAL_FILE = os.path.join(TEST_RESULTS_DIR, "last_proposal.json")
METRICS_FILE = os.path.join(TEST_RESULTS_DIR, "pw_results.json")
RULES_FILE = os.path.join(ROOT_DIR, ".agent", "rules", "agent-behavior.md")
LOG_FILE = os.path.join(TEST_RESULTS_DIR, "mutation_log.jsonl")
COMMIT_ERRORS = os.path.join(TEST_RESULTS_DIR, "commit_errors.log")

def read_json(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    return None

def main():
    if not os.path.exists(GATE_STATUS_FILE):
        print("Error: gate_status.txt not found. Running gate first?")
        return
    
    with open(GATE_STATUS_FILE, 'r') as f:
        status = f.read().strip()
        
    if status != "APPROVED":
        print(f"Apply Mutation skipped: Current status is {status}.")
        return
        
    proposal = read_json(PROPOSAL_FILE)
    metrics = read_json(METRICS_FILE)
    
    if not proposal:
        print("Error: last_proposal.json missing.")
        return
        
    # Append mutation to agent-behavior.md
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    with open(RULES_FILE, 'a', encoding='utf-8') as f:
        f.write(f"\n## Auto-Mutation: {date_str}\n")
        f.write(f"**Target:** {proposal['rule_target']} | **Type:** {proposal['mutation_type']}\n")
        f.write(f"**Expected:** {proposal['expected_improvement']}\n\n")
        f.write(f"{proposal['content']}\n---\n")
        
    print(f"Applied mutation to {RULES_FILE}")
    
    # Run Git Commands
    pass_rate = metrics.get('pass_rate', 0.0) if metrics else 0.0
    commit_msg = f"feat(agent): auto-improve from playwright metrics [pass_rate={pass_rate}%]"
    
    try:
        # Adding rules and log
        subprocess.run(["git", "add", RULES_FILE, LOG_FILE], check=True, capture_output=True, cwd=ROOT_DIR)
        
        # Commit
        subprocess.run(["git", "commit", "-m", commit_msg], check=True, capture_output=True, cwd=ROOT_DIR)
        print(f"Git commit successful: {commit_msg}")
    except subprocess.CalledProcessError as e:
        error_msg = f"Git failed: {e.stderr.decode() if e.stderr else str(e)}"
        print(error_msg)
        with open(COMMIT_ERRORS, 'w') as f:
            f.write(error_msg)
        # Exit with error as requested in Step 4
        exit(1)

if __name__ == "__main__":
    main()
