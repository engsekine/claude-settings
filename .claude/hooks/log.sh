#!/bin/bash
# Claude Code のプロンプトをログに記録する

INPUT=$(cat)
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null)

if [ -n "$PROMPT" ]; then
  {
    echo "[$TIMESTAMP] [USER]"
    echo "$PROMPT"
  } >> "$LOG_DIR/conversation.log"
fi
