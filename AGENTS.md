# AGENTS.md — Global & Local Agent Skill Setup
> This repository uses multiple official and community skill repos for enhanced agentic capabilities.

## LLM Backend
> All agents use **Groq Cloud** (free tier). Set `GROQ_API_KEY` in `.env`. No other key required.
- Model (Primary): `llama-3.3-70b-versatile`
- Model (Fast): `llama-3.1-8b-instant`

## Core Frameworks
1. **AutoGen**: Multi-agent conversational framework (wired to Groq).
2. **CrewAI**: Role-playing collaborative agents (wired to Groq).
3. **LangChain-Groq**: Foundation layer for Groq LLM interaction.

## Skill Repositories (Local: .antigravity/skills/)
1. **awesome-copilot** (GitHub): Curated collection of verification and elegance skills.
   - Path: `.antigravity/skills/awesome-copilot`
2. **awesome-agent-skills** (Kodustech): Task management and general agent skills.
   - Path: `.antigravity/skills/awesome-agent-skills`

## Environment Setup
- **Python Env**: `agent-skills` (venv)
- **Dependencies**: `pyautogen`, `crewai`, `crewai-tools`, `langchain-groq`, `python-dotenv`

## Key Capabilities
- **Multi-Agent Simulation**: Via AutoGen.
- **Task-Oriented Crews**: Via CrewAI.
- **Verification**: Via awesome-copilot "verify-before-done" skills.
- **Task Management**: Via awesome-agent-skills patterns.

## Global References
For global access, these are symlinked to `~/.gemini/global-skills/`.
Any AGENT instance can access these via the global config at `~/.gemini/config.yaml`.
