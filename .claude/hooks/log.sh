#!/bin/bash
# Claude Code のイベントを統合ログに記録する
# 対応イベント: UserPromptSubmit, PostToolUse

INPUT=$(cat)
LOG_DIR=".claude/logs"
mkdir -p "$LOG_DIR"

TIMESTAMP=$(date +"%Y-%m-%d %H:%M:%S")

# イベントの種類を判定
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name // empty' 2>/dev/null)
PROMPT=$(echo "$INPUT" | jq -r '.prompt // empty' 2>/dev/null)

if [ -n "$TOOL_NAME" ]; then
  # PostToolUse イベント

  # Skill ツールの場合はスキルログに記録
  if [ "$TOOL_NAME" = "Skill" ]; then
    SKILL_NAME=$(echo "$INPUT" | jq -r '.tool_input.skill // empty' 2>/dev/null)
    echo "[$TIMESTAMP] $SKILL_NAME" >> "$LOG_DIR/skill.log"
  fi

  # 全ツール使用をアクティビティログに記録
  TOOL_INPUT=$(echo "$INPUT" | jq -c '.tool_input' 2>/dev/null)
  echo "[$TIMESTAMP] [$TOOL_NAME] $TOOL_INPUT" >> "$LOG_DIR/activity.log"

elif [ -n "$PROMPT" ]; then
  # UserPromptSubmit イベント
  SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // empty' 2>/dev/null)
  echo "[$TIMESTAMP] [$SESSION_ID] $PROMPT" >> "$LOG_DIR/prompt.log"

  # スラッシュコマンド(/で始まるプロンプト)をスキルログに記録
  if echo "$PROMPT" | grep -q '^/'; then
    SKILL_NAME=$(echo "$PROMPT" | awk '{print $1}')
    echo "[$TIMESTAMP] $SKILL_NAME" >> "$LOG_DIR/skill.log"
  fi
fi
