#!/bin/bash
# Stop イベント: Claude の応答を記録する

INPUT=$(cat)
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
STOP_REASON=$(echo "$INPUT" | jq -r '.stop_reason // empty' 2>/dev/null)
RESPONSE=$(echo "$INPUT" | jq -r '.response // empty' 2>/dev/null)

if [ -n "$RESPONSE" ]; then
  {
    echo "=== [$TIMESTAMP] stop_reason=$STOP_REASON ==="
    echo "$RESPONSE"
    echo ""
  } >> "$LOG_DIR/response.log"
fi
