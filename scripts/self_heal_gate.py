import os
import json
from datetime import datetime

# Paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_RESULTS_DIR = os.path.join(ROOT_DIR, "test-results")
METRICS_FILE = os.path.join(TEST_RESULTS_DIR, "pw_results.json")
PROPOSAL_FILE = os.path.join(TEST_RESULTS_DIR, "last_proposal.json")
LOG_FILE = os.path.join(TEST_RESULTS_DIR, "mutation_log.jsonl")
PENDING_FILE = os.path.join(ROOT_DIR, "PENDING_MUTATIONS.md")
GATE_STATUS = os.path.join(TEST_RESULTS_DIR, "gate_status.txt")

def read_json(path):
    if not os.path.exists(path):
        return None
    with open(path, 'r', encoding='utf-8') as f:
        return json.load(f)

def log_decision(decision, metrics, proposal):
    log_entry = {
        "timestamp": datetime.now().isoformat(),
        "decision": decision,
        "pass_rate": metrics.get("pass_rate", 0),
        "confidence": proposal.get("confidence", 0),
        "proposal_target": proposal.get("rule_target"),
        "expected_improvement": proposal.get("expected_improvement")
    }
    with open(LOG_FILE, 'a', encoding='utf-8') as f:
        f.write(json.dumps(log_entry) + '\n')

def main():
    if not os.path.exists(TEST_RESULTS_DIR):
        os.makedirs(TEST_RESULTS_DIR)
        
    metrics = read_json(METRICS_FILE)
    proposal = read_json(PROPOSAL_FILE)
    
    if not metrics or not proposal:
        print("Gate validation failed: Missing metrics or proposal file.")
        with open(GATE_STATUS, 'w') as f: f.write("ERROR")
        return
    
    pass_rate = metrics.get("pass_rate", 0.0)
    confidence = proposal.get("confidence", 0.0)
    
    # Gate logic as requested
    approved = (pass_rate >= 80.0) and (confidence >= 0.7)
    
    if approved:
        msg = f"GATE APPROVED: Pass rate {pass_rate}% | Confidence {confidence}"
        print(msg)
        log_decision("APPROVED", metrics, proposal)
        with open(GATE_STATUS, 'w') as f:
            f.write("APPROVED")
    else:
        msg = f"GATE BLOCKED: Pass rate {pass_rate}% | Confidence {confidence}"
        print(msg)
        log_decision("BLOCKED", metrics, proposal)
        # Write PENDING_MUTATIONS.md with detailed report
        with open(PENDING_FILE, 'w', encoding='utf-8') as f:
             f.write(f"# 🛡️ PENDING MUTATION PROPOSAL\n\n")
             f.write(f"> [!WARNING]\n")
             f.write(f"> This mutation was BLOCKED by the gate criteria (Pass Rate >= 80% and Confidence >= 70%).\n\n")
             f.write(f"## 📊 Metrics Report\n")
             f.write(f"- **Current Pass Rate:** {pass_rate}%\n")
             f.write(f"- **Proposal Confidence:** {int(confidence * 100)}%\n\n")
             f.write(f"## 🧠 Proposal for `{proposal['rule_target']}`\n")
             f.write(f"- **Mutation Type:** {proposal['mutation_type']}\n")
             f.write(f"- **Expected Improvement:** {proposal['expected_improvement']}\n\n")
             f.write(f"### Proposed Content\n```markdown\n{proposal['content']}\n```\n")
        
        with open(GATE_STATUS, 'w') as f:
            f.write("BLOCKED")

if __name__ == "__main__":
    main()
