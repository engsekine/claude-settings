#!/bin/bash
# 全 MCP サーバーを一括セットアップするスクリプト

SCRIPT_DIR="$(cd "$(dirname "$0")/mcp" && pwd)"

echo "Setting up MCP servers..."

# 各 MCP サーバーのセットアップスクリプトを実行
bash "$SCRIPT_DIR/setup-context7.sh"
bash "$SCRIPT_DIR/setup-next-devtools.sh"
bash "$SCRIPT_DIR/setup-figma.sh"
bash "$SCRIPT_DIR/setup-storybook.sh"

echo ""
echo "✅ All MCP servers configured successfully"
