#!/bin/bash
# Context7 MCP サーバーの設定を追加するスクリプト

SETTINGS_DIR="/home/node/.claude"
SETTINGS_FILE="$SETTINGS_DIR/settings.json"

mkdir -p "$SETTINGS_DIR"

MCP_ENTRY='{
  "command": "npx",
  "args": ["-y", "@context7/mcp-server"]
}'

if [ -f "$SETTINGS_FILE" ]; then
  # 既存の settings.json に context7 エントリを追加・上書き
  jq --argjson entry "$MCP_ENTRY" '.mcpServers.context7 = $entry' "$SETTINGS_FILE" > /tmp/mcp-settings.json \
    && mv /tmp/mcp-settings.json "$SETTINGS_FILE"
else
  # 新規作成
  jq -n --argjson entry "$MCP_ENTRY" '{"mcpServers": {"context7": $entry}}' > "$SETTINGS_FILE"
fi

echo "Context7 MCP configured: $SETTINGS_FILE"
