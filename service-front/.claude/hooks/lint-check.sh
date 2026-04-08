#!/bin/bash
# Edit/Write時のLintチェック

# stdinからJSON入力を読み込む
INPUT=$(cat)
TOOL_NAME=$(echo "$INPUT" | jq -r '.tool_name')
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path')

# TypeScript/TSX/JSXファイルの場合のみLintチェック
if [[ "$FILE_PATH" =~ \.(ts|tsx|jsx)$ ]] && [[ -f "$FILE_PATH" ]]; then
  echo "🔍 Running lint check on $FILE_PATH..."
  if ! npm run lint -- "$FILE_PATH" --quiet 2>/dev/null; then
    echo "⚠️  Lint warnings found in $FILE_PATH (proceeding anyway)"
  fi
fi
