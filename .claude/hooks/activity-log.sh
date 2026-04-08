#!/bin/bash
# ツール使用履歴を記録

INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name')
TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input')

LOG_FILE=".claude/logs/activity.log"

mkdir -p "$(dirname "$LOG_FILE")"

echo "[$(date +"%Y-%m-%d %H:%M:%S")] [$TOOL_NAME] $TOOL_INPUT" >> "$LOG_FILE"
