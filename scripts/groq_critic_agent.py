import os
import json
from datetime import datetime
from crewai import LLM, Agent, Task, Crew
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import List, Literal

# Load environment variables
load_dotenv()

# Primary and Fast models
groq_primary = LLM(model="groq/llama-3.3-70b-versatile", api_key=os.getenv("GROQ_API_KEY"), temperature=0.1)
groq_fast = LLM(model="groq/llama-3.1-8b-instant", api_key=os.getenv("GROQ_API_KEY"), temperature=0.1)

class SelfHealIssue(BaseModel):
    severity: Literal["HIGH", "MEDIUM", "LOW"]
    file: str
    issue: str
    fix: str

class SelfHealPlan(BaseModel):
    issues: List[SelfHealIssue]
    self_heal_plan: List[str] # Top 3 fixes

# Paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SCRIPTS_DIR = os.path.join(ROOT_DIR, "scripts")
TEST_RESULTS_DIR = os.path.join(ROOT_DIR, "test-results")
AGENT_RULES_DIR = os.path.join(ROOT_DIR, ".agent", "rules")
REPORT_FILE = os.path.join(AGENT_RULES_DIR, "SELF_HEAL_REPORT.md")

def read_file_safe(path):
    if os.path.exists(path):
        with open(path, 'r', encoding='utf-8') as f:
            return f.read()
    return ""

def main():
    # Gather pipeline components for audit
    pipeline_scripts = [
        "pw_report_collector.py", 
        "groq_reflexion_agent.py", 
        "self_heal_gate.py", 
        "apply_mutation.py"
    ]
    
    all_scripts_content = ""
    for name in pipeline_scripts:
        all_scripts_content += f"### FILE: {name}\n```python\n{read_file_safe(os.path.join(SCRIPTS_DIR, name))}\n```\n\n"
        
    mutation_log = read_file_safe(os.path.join(TEST_RESULTS_DIR, "mutation_log.jsonl"))
    pw_results = read_file_safe(os.path.join(TEST_RESULTS_DIR, "pw_results.json"))
    
    # Implementation Auditor Agent
    auditor = Agent(
        role="Implementation Auditor",
        goal="Identify anti-patterns, gaps, and risks in the self-improvement pipeline.",
        backstory="You are a senior DevOps Engineer and Architect specialized in automated self-healing systems.",
        llm=groq_primary,
        verbose=True
    )
    
    audit_prompt = f"""
You are auditing a self-improvement pipeline implementation.
Files Content:
{all_scripts_content}

Historical Context:
Mutation Log: {mutation_log}
Current Test Results: {pw_results}

Task: Identify ALL anti-patterns, gaps, and risks.
For each issue, propose a fix. Output as a structured JSON:
{{ "issues": [ {{"severity": "HIGH|MEDIUM|LOW", "file": str, "issue": str, "fix": str}} ], "self_heal_plan": [str, str, str] }}
"""
    
    audit_task = Task(
        description=audit_prompt,
        expected_output="A list of issues found with severity and recommended fixes.",
        agent=auditor,
        output_pydantic=SelfHealPlan
    )
    
    crew = Crew(agents=[auditor], tasks=[audit_task], verbose=True)
    
    try:
        result = crew.kickoff()
        report_data = result.pydantic
        
        # Save Report
        if not os.path.exists(AGENT_RULES_DIR):
            os.makedirs(AGENT_RULES_DIR)
            
        with open(REPORT_FILE, 'w', encoding='utf-8') as f:
            f.write(f"# 🔍 SELF-HEAL AUDIT REPORT\n\n")
            f.write(f"*Last Updated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}*\n\n")
            
            f.write("## 🚀 Top 3 Recommended Fixes\n")
            for action in report_data.self_heal_plan:
                f.write(f"- {action}\n")
            f.write("\n---\n")
            
            f.write("## 📝 Detailed Issues Found\n")
            for issue in report_data.issues:
                icon = "🔴" if issue.severity == "HIGH" else "🟡" if issue.severity == "MEDIUM" else "🔵"
                f.write(f"### {icon} [{issue.severity}] {issue.file}\n")
                f.write(f"- **Issue:** {issue.issue}\n")
                f.write(f"- **Proposed Fix:** {issue.fix}\n\n")
        
        print(f"Audit complete. Report generated at {REPORT_FILE}")
        
    except Exception as e:
        print(f"Error in Critic Agent Audit: {e}")

if __name__ == "__main__":
    main()
