import os
import json
import subprocess
import re
from pydantic import BaseModel
from typing import List

# Paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEST_RESULTS_DIR = os.path.join(ROOT_DIR, "test-results")
PW_RESULTS_JSON = os.path.join(TEST_RESULTS_DIR, "pw_results.json")
BASELINE_JSON = os.path.join(TEST_RESULTS_DIR, "baseline.json")

class PlaywrightMetrics(BaseModel):
    pass_rate: float
    avg_duration_ms: float
    failure_patterns: List[str]
    flaky_tests: List[str]
    coverage_delta: float

def ensure_dir(d):
    if not os.path.exists(d):
        os.makedirs(d)

def run_playwright_test():
    """Runs playwright tests and returns the parsed JSON data."""
    print("Running Playwright tests...")
    try:
        # Using shell=True for 'npx' on Windows
        process = subprocess.run("npx playwright test --reporter=json", shell=True, capture_output=True, text=True, cwd=ROOT_DIR)
        raw_output = process.stdout
        
        # Find the start of the JSON block if there's noise
        try:
            return json.loads(raw_output)
        except json.JSONDecodeError:
            match = re.search(r'\{.*\}', raw_output, re.DOTALL)
            if match:
                return json.loads(match.group())
            else:
                print("Failed to find valid JSON in Playwright output.")
                return None
    except Exception as e:
        print(f"Error executing Playwright: {e}")
        return None

def traverse_data(data, metrics_collector):
    """Recursively extracts failures and flaky tests from the data."""
    if "suites" in data:
        for suite in data["suites"]:
            traverse_data(suite, metrics_collector)
    if "specs" in data:
        for spec in data["specs"]:
            for test in spec.get("tests", []):
                for result in test.get("results", []):
                    if result.get("status") == "failed":
                        msg = result.get("error", {}).get("message", "No error message")
                        summary = msg.split('\n')[0][:100]
                        metrics_collector["failure_patterns"].append(f"{test['title']} | {summary}")
                    if result.get("status") == "flaky":
                        metrics_collector["flaky_tests"].append(test['title'])

def collect_metrics(data):
    stats = data.get("stats", {})
    total = stats.get("total", 0)
    passed = stats.get("expected", 0)
    
    pass_rate = (passed / total * 100.0) if total > 0 else 0.0
    duration_ms = stats.get("duration", 0.0)
    avg_duration_ms = (duration_ms / total) if total > 0 else 0.0
    
    collector = {"failure_patterns": [], "flaky_tests": []}
    traverse_data(data, collector)
    
    # Handle coverage and baseline
    baseline_coverage = 0.0
    if os.path.exists(BASELINE_JSON):
        try:
            with open(BASELINE_JSON, 'r') as f:
                baseline = json.load(f)
                baseline_coverage = baseline.get("coverage", 0.0)
        except Exception:
            pass
    else:
        # Initialize if doesn't exist
        with open(BASELINE_JSON, 'w') as f:
            json.dump({"coverage": 0.0}, f)
            
    # For now, we use a placeholder or check if a coverage file exists
    # (Playwright doesn't provide coverage in JSON output by default)
    current_coverage = stats.get("coverage", 0.0) # Placeholder
    coverage_delta = current_coverage - baseline_coverage
    
    # Store this for next comparison if pass_rate was decent
    if pass_rate > 50:
         with open(BASELINE_JSON, 'w') as f:
            json.dump({"coverage": current_coverage}, f)
            
    return PlaywrightMetrics(
        pass_rate=pass_rate,
        avg_duration_ms=avg_duration_ms,
        failure_patterns=list(set(collector["failure_patterns"]))[:10],
        flaky_tests=list(set(collector["flaky_tests"])),
        coverage_delta=coverage_delta
    )

def main():
    ensure_dir(TEST_RESULTS_DIR)
    data = run_playwright_test()
    if data:
        metrics = collect_metrics(data)
        with open(PW_RESULTS_JSON, 'w') as f:
            f.write(metrics.model_dump_json(indent=2))
        print(f"Metrics saved to {PW_RESULTS_JSON}")
    else:
        print("Collector failed: missing test data.")

if __name__ == "__main__":
    main()
