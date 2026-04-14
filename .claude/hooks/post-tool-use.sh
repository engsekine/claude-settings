#!/bin/bash
# PostToolUse イベント: ツール使用をログに記録する

INPUT=$(cat)
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)

# Skill ツールの場合はスキルログに記録
if [ "$TOOL_NAME" = "Skill" ]; then
  SKILL_NAME=$(echo "$INPUT" | jq -r '.tool_input.skill // empty' 2>/dev/null)
  echo "[$TIMESTAMP] $SKILL_NAME" >> "$LOG_DIR/skill.log"
fi

# 全ツール使用をアクティビティログに記録
TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input' 2>/dev/null)
echo "[$TIMESTAMP] [$TOOL_NAME] $TOOL_INPUT" >> "$LOG_DIR/activity.log"
