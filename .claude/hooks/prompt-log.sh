#!/bin/bash
# ユーザーのプロンプトを記録

INPUT=$(cat)
PROMPT=$(echo "$INPUT" | jq -r '.prompt')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id')

LOG_FILE=".claude/logs/prompt.log"

mkdir -p "$(dirname "$LOG_FILE")"

echo "[$(date +"%Y-%m-%d %H:%M:%S")] [Prompt] [$SESSION_ID] $PROMPT" >> "$LOG_FILE"
