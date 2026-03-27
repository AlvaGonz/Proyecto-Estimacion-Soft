# run_post_task.ps1 — PowerShell wrapper for post_task_loop.py
# Usage: .\scripts\run_post_task.ps1 "task description" "output description"

param (
    [string]$Task = "No task description provided",
    [string]$Output = "No output description provided"
)

# Attempt to activate conda environment if it exists
if (Get-Command conda -ErrorAction SilentlyContinue) {
    conda activate agent-skills 2>$null
}

python scripts/post_task_loop.py --task "$Task" --output "$Output"
