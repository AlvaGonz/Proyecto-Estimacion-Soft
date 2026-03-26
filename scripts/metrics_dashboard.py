import os
import json
from datetime import datetime

# Paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_RESULTS_DIR = os.path.join(ROOT_DIR, "test-results")
LOG_FILE = os.path.join(TEST_RESULTS_DIR, "mutation_log.jsonl")
DASHBOARD_FILE = os.path.join(TEST_RESULTS_DIR, "METRICS.md")
PW_RESULTS_FILE = os.path.join(TEST_RESULTS_DIR, "pw_results.json")

def read_logs():
    logs = []
    if os.path.exists(LOG_FILE):
        with open(LOG_FILE, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip():
                    logs.append(json.loads(line))
    return logs

def main():
    if not os.path.exists(TEST_RESULTS_DIR):
        os.makedirs(TEST_RESULTS_DIR)

    logs = read_logs()
    
    # Header
    content = "# 📊 QUANTIFIABLE METRICS DASHBOARD\n\n"
    content += f"*Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n"
    
    if not logs:
        content += "> [!NOTE]\n> No pipeline data available yet. Run the self-improvement loop to populate this dashboard.\n"
    else:
        # Pipeline Stats
        total_runs = len(logs)
        approved_runs = len([l for l in logs if l.get("decision") == "APPROVED"])
        acceptance_rate = (approved_runs / total_runs * 100) if total_runs > 0 else 0
        avg_confidence = sum([l.get("confidence", 0) for l in logs]) / total_runs if total_runs > 0 else 0

        content += "## ⚙️ Pipeline Performance\n"
        content += f"- **Total Pipeline Runs:** {total_runs}\n"
        content += f"- **Mutation Acceptance Rate:** `{acceptance_rate:.1f}%` ({approved_runs}/{total_runs} approved)\n"
        content += f"- **Average Logic Confidence:** `{int(avg_confidence * 100)}%` (based on Groq scores)\n\n"
        
        # Pass Rate Trend
        content += "## 📈 Pass Rate Trend (Last 5 Runs)\n"
        content += "| Run ID | Date | Pass Rate |\n"
        content += "|---|---|---|\n"
        for i, log in enumerate(logs[-5:][::-1]):
            ts = log.get("timestamp", "").split('T')[0]
            content += f"| {total_runs - i} | {ts} | {log.get('pass_rate', 0)}% |\n"
        content += "\n"

    # Recurring Failures (from latest pw_results.json)
    content += "## ⚠️ Top Recurring Failure Patterns\n"
    if os.path.exists(PW_RESULTS_FILE):
        try:
             with open(PW_RESULTS_FILE, 'r') as f:
                 pw_data = json.load(f)
                 failures = pw_data.get("failure_patterns", [])
                 if failures:
                     for fail in failures:
                         content += f"- `{fail}`\n"
                 else:
                     content += "- ✅ No failures detected in latest run.\n"
        except:
            content += "- ❌ Error reading latest test results.\n"
    else:
        content += "- ℹ️ Test results not found.\n"

    with open(DASHBOARD_FILE, 'w', encoding='utf-8') as f:
        f.write(content)
        
    print(f"Metrics dashboard generated at {DASHBOARD_FILE}")

if __name__ == "__main__":
    main()
