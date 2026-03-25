# Groq Free Tier — LLM Config Reference

## AutoGen Config (paste in any autogen script)
```python
import os
from dotenv import load_dotenv
load_dotenv()

config_list = [
    {
        "model": os.getenv("GROQ_MODEL_PRIMARY"),   # llama-3.3-70b-versatile
        "api_key": os.getenv("GROQ_API_KEY"),
        "api_type": "groq",
    }
]
llm_config = {"config_list": config_list, "temperature": 0.1}
```

## CrewAI Config (paste in any crew script)
```python
import os
from dotenv import load_dotenv
from crewai import LLM
load_dotenv()

groq_llm = LLM(
    model="groq/llama-3.3-70b-versatile",
    api_key=os.getenv("GROQ_API_KEY"),
    temperature=0.1
)
```

## Rate Limit Strategy
- Primary model  → llama-3.3-70b-versatile (100K tokens/day, 30 req/min)
- Fallback model → llama-3.1-8b-instant    (500K tokens/day, 30 req/min)
- Switch to fast model when daily tokens > 80K to preserve quota
