import os
import json
from crewai import LLM, Agent, Task, Crew
from dotenv import load_dotenv
from pydantic import BaseModel, Field
from typing import Literal

# Load environment variables
load_dotenv()

# LLM Config from GROQ_CONFIG.md
# Note: In a production script, we'd have logic to track token usage and fallback.
groq_llm = LLM(
    model="groq/llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.1
)

class MutationProposal(BaseModel):
    rule_target: str
    mutation_type: Literal["ADD", "MODIFY", "DELETE"]
    content: str
    expected_improvement: str
    confidence: float = Field(..., ge=0.0, le=1.0)

# Paths
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RULES_FILE = os.path.join(ROOT_DIR, ".agent", "rules", "agent-behavior.md")
METRICS_FILE = os.path.join(ROOT_DIR, "test-results", "pw_results.json")
PROPOSAL_FILE = os.path.join(ROOT_DIR, "test-results", "last_proposal.json")

def read_file(path):
    if not os.path.exists(path):
        return ""
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def run_reflexion():
    metrics_json = read_file(METRICS_FILE)
    current_rules = read_file(RULES_FILE)
    
    if not metrics_json:
        print("Error: No metrics found in test-results/pw_results.json")
        return None
    
    # Define logic for Agentic Reflexion
    reflexion_agent = Agent(
        role="Dev Environment Self-Improver",
        goal="Given PlaywrightMetrics, propose ONE specific, targeted mutation to agent behavior rules.",
        backstory="You are a senior QA architect who reads test signals and improves AI agent rules.",
        llm=groq_llm,
        verbose=True
    )
    
    # Prompt template as specified in constraints
    prompt_text = f"""
You are analyzing test results for a software estimation platform.
Metrics: {metrics_json}
Current agent behavior rules: {current_rules}
Task: Propose exactly ONE mutation to improve test outcomes.
Output as JSON: {{"rule_target": str, "mutation_type": "ADD|MODIFY|DELETE", "content": str, "expected_improvement": str, "confidence": float}}
Do NOT propose mutations with confidence < 0.7.
    """
    
    reflexion_task = Task(
        description=prompt_text,
        expected_output="A JSON mutation proposal object.",
        agent=reflexion_agent,
        output_pydantic=MutationProposal
    )
    
    crew = Crew(
        agents=[reflexion_agent],
        tasks=[reflexion_task],
        verbose=True
    )
    
    try:
        result = crew.kickoff()
        # CrewAI result is a FlowResult/TaskOutput object, pydantic field is available via .pydantic
        if hasattr(result, 'pydantic'):
            return result.pydantic
        return result
    except Exception as e:
        print(f"Error in Groq Reflexion Agent: {e}")
        return None

def main():
    proposal = run_reflexion()
    if proposal:
        # Pydantic validation is handled by crewai output_pydantic
        if proposal.confidence < 0.7:
             print(f"Aborting: Mutation confidence {proposal.confidence} is below threshold 0.7.")
             return
             
        with open(PROPOSAL_FILE, 'w') as f:
            f.write(proposal.model_dump_json(indent=2))
        print(f"Proposal generated for target '{proposal.rule_target}' with confidence {proposal.confidence}")
    else:
        print("No valid proposal generated.")

if __name__ == "__main__":
    main()
