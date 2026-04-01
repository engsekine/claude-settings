.PHONY: help setup cert clean dev dev-https build test lint format

## ヘルプ表示
help:
	@echo "Usage:"
	@echo "  make setup       初回セットアップ（npm install + SSL証明書生成）"
	@echo "  make cert        SSL証明書を生成"
	@echo "  make clean       node_modules と証明書を削除"
	@echo "  make dev         開発サーバー起動（HTTP）"
	@echo "  make dev-https   開発サーバー起動（HTTPS）"
	@echo "  make build       プロダクションビルド"
	@echo "  make test        テスト実行"
	@echo "  make lint        Lint実行"
	@echo "  make format      フォーマット実行"

## 初回セットアップ
setup: cert
	@echo "📦 Installing dependencies..."
	npm install
	@echo "✅ Setup complete!"
	@echo ""
	@echo "次のステップ:"
	@echo "  make dev-https  # HTTPS開発サーバー起動"

## SSL証明書を生成
cert:
	@echo "🔐 Generating SSL certificates..."
	@if ! command -v mkcert > /dev/null; then \
		echo "❌ Error: mkcert is not installed."; \
		echo ""; \
		echo "Install mkcert:"; \
		echo "  macOS:   brew install mkcert"; \
		echo "  Windows: choco install mkcert"; \
		echo "  Linux:   See README.md"; \
		exit 1; \
	fi
	@if [ ! -f "$(HOME)/.local/share/mkcert/rootCA.pem" ] && [ ! -f "$(HOME)/Library/Application Support/mkcert/rootCA.pem" ]; then \
		echo "Installing mkcert root CA..."; \
		mkcert -install; \
	fi
	@if [ -f localhost.pem ]; then \
		echo "⚠️  localhost.pem already exists. Skipping certificate generation."; \
		echo "   To regenerate, run: make clean-cert && make cert"; \
	else \
		mkcert localhost 127.0.0.1 ::1; \
		mv localhost+2.pem localhost.pem 2>/dev/null || true; \
		mv localhost+2-key.pem localhost-key.pem 2>/dev/null || true; \
		echo "✅ SSL certificates generated:"; \
		echo "   - localhost.pem"; \
		echo "   - localhost-key.pem"; \
	fi

## SSL証明書のみ削除
clean-cert:
	@echo "🗑️  Removing SSL certificates..."
	rm -f localhost*.pem
	@echo "✅ Certificates removed."

## すべてクリーンアップ
clean: clean-cert
	@echo "🗑️  Removing node_modules and build artifacts..."
	rm -rf node_modules package-lock.json .next
	@echo "✅ Clean complete."

## 開発サーバー起動（HTTP）
dev:
	npm run dev

## 開発サーバー起動（HTTPS）
dev-https:
	@if [ ! -f localhost.pem ]; then \
		echo "❌ SSL certificate not found. Running 'make cert'..."; \
		$(MAKE) cert; \
	fi
	npm run dev:https

## プロダクションビルド
build:
	npm run build

## テスト実行
test:
	npm run test

## Lint実行
lint:
	npm run lint

## フォーマット実行
format:
	npm run format

## 型チェック
type-check:
	npm run type-check

## すべてのチェックを実行
validate:
	npm run validate
