#!/bin/bash
# Claude Code のプロンプトをログに記録する

INPUT=$(cat)
LOG_DIR=".claude/logs"
LOG_FILE="$LOG_DIR/conversation.log"
mkdir -p "$LOG_DIR"
# ログファイルが存在しなければ作成する
[ -f "$LOG_FILE" ] || touch "$LOG_FILE"

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null)

if [ -n "$PROMPT" ]; then
  {
    echo "[$TIMESTAMP] [USER]"
    echo "$PROMPT"
  } >> "$LOG_FILE"
fi
