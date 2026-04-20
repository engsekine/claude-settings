#!/bin/bash
# Claude Code のレスポンスをログに記録する

INPUT=$(cat)
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
RESPONSE=$(echo "$INPUT" | jq -r '.last_assistant_message // empty' 2>/dev/null)

if [ -n "$RESPONSE" ]; then
  {
    echo "[$TIMESTAMP] [CLAUDE]"
    echo "$RESPONSE"
    echo ""
    echo ""
  } >> "$LOG_DIR/conversation.log"
fi
