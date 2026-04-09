.PHONY: help setup cert clean clean-cert dev dev-https build test lint format type-check validate up down logs

COMPOSE := docker compose -f docker-compose.dev.yml
SERVICE := app

## ヘルプ表示
help:
	@echo "Usage:"
	@echo ""
	@echo "  [Docker]"
	@echo "  make up          コンテナ起動（バックグラウンド）"
	@echo "  make down        コンテナ停止・削除"
	@echo "  make logs        コンテナログ表示"
	@echo ""
	@echo "  [開発]"
	@echo "  make dev         開発サーバー起動（HTTP）"
	@echo "  make dev-https   開発サーバー起動（HTTPS）"
	@echo ""
	@echo "  [ビルド・テスト]"
	@echo "  make build       プロダクションビルド"
	@echo "  make test        テスト実行"
	@echo "  make lint        Lint実行"
	@echo "  make format      フォーマット実行"
	@echo "  make type-check  型チェック"
	@echo "  make validate    すべてのチェックを実行"
	@echo ""
	@echo "  [セットアップ]"
	@echo "  make setup       初回セットアップ（npm install + SSL証明書生成）"
	@echo "  make cert        SSL証明書を生成"
	@echo "  make clean       node_modules と証明書を削除"

## コンテナ起動（バックグラウンド）
up:
	$(COMPOSE) up -d --build

## コンテナ停止・削除（anonymous volume も削除）
down:
	$(COMPOSE) down -v

## コンテナログ表示
logs:
	$(COMPOSE) logs -f $(SERVICE)

## 初回セットアップ
setup: cert
	@echo "📦 Installing dependencies..."
	$(COMPOSE) run --rm $(SERVICE) npm install
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
clean: clean-cert down
	@echo "🗑️  Removing build artifacts..."
	$(COMPOSE) down --volumes --rmi local
	@echo "✅ Clean complete."

## 開発サーバー起動（HTTP）
dev:
	$(COMPOSE) run --rm --service-ports $(SERVICE) npm run dev

## 開発サーバー起動（HTTPS）
dev-https:
	@if [ ! -f localhost.pem ]; then \
		echo "❌ SSL certificate not found. Running 'make cert'..."; \
		$(MAKE) cert; \
	fi
	$(COMPOSE) up --build -d

## プロダクションビルド
build:
	$(COMPOSE) exec $(SERVICE) npm run build

## テスト実行
test:
	$(COMPOSE) exec $(SERVICE) npm run test

## Lint実行
lint:
	$(COMPOSE) exec $(SERVICE) npm run lint

## フォーマット実行
format:
	$(COMPOSE) exec $(SERVICE) npm run format

## 型チェック
type-check:
	$(COMPOSE) exec $(SERVICE) npm run type-check

## すべてのチェックを実行
validate:
	$(COMPOSE) exec $(SERVICE) npm run validate
