#!/bin/bash
# Storybook MCP サーバーの設定を追加するスクリプト

SETTINGS_DIR="/home/node/.claude"
SETTINGS_FILE="$SETTINGS_DIR/settings.json"

mkdir -p "$SETTINGS_DIR"

MCP_ENTRY='{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-storybook"]
}'

if [ -f "$SETTINGS_FILE" ]; then
  # 既存の settings.json に storybook エントリを追加・上書き
  jq --argjson entry "$MCP_ENTRY" '.mcpServers.storybook = $entry' "$SETTINGS_FILE" > /tmp/mcp-settings.json \
    && mv /tmp/mcp-settings.json "$SETTINGS_FILE"
else
  # 新規作成
  jq -n --argjson entry "$MCP_ENTRY" '{"mcpServers": {"storybook": $entry}}' > "$SETTINGS_FILE"
fi

echo "Storybook MCP configured: $SETTINGS_FILE"
