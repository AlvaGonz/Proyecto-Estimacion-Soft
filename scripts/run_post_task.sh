#!/bin/bash
# run_post_task.sh — Shell wrapper for post_task_loop.py
# Usage: bash scripts/run_post_task.sh "task description" "output description"
# Called automatically by AGENTS.md hook after every agent task.

TASK="${1:-No task description provided}"
OUTPUT="${2:-No output description provided}"

conda activate agent-skills 2>/dev/null || true
python scripts/post_task_loop.py --task "$TASK" --output "$OUTPUT"
