#!/bin/bash
# MCP サーバーの設定を /home/node/.claude/settings.json に追加するスクリプト

SETTINGS_DIR="/home/node/.claude"
SETTINGS_FILE="$SETTINGS_DIR/settings.json"

mkdir -p "$SETTINGS_DIR"

MCP_SERVERS='{
  "context7": {
    "command": "npx",
    "args": ["-y", "@context7/mcp-server"]
  },
  "next-devtools": {
    "command": "npx",
    "args": ["-y", "next-devtools-mcp"]
  },
  "figma": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-figma"]
  }
}'

if [ -f "$SETTINGS_FILE" ]; then
  # 既存の settings.json に MCP サーバーを追加・上書き
  jq --argjson servers "$MCP_SERVERS" '.mcpServers = $servers' "$SETTINGS_FILE" > /tmp/mcp-settings.json \
    && mv /tmp/mcp-settings.json "$SETTINGS_FILE"
else
  # 新規作成
  jq -n --argjson servers "$MCP_SERVERS" '{"mcpServers": $servers}' > "$SETTINGS_FILE"
fi

echo "MCP servers configured: $SETTINGS_FILE"
echo "- Context7"
echo "- Next Devtools"
echo "- Figma"
