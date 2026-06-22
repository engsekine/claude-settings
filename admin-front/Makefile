.PHONY: help cert clean clean-cert \
        dev dev-https build start \
        lint lint-fix \
        format format-check \
        check check-fix \
        type-check \
        test test-watch test-coverage \
        validate

## ヘルプ表示
help:
	@echo "Usage (admin-front / 運営管理画面・ポート 3001):"
	@echo ""
	@echo "  ※ service-front と異なり Docker を使わず npm で直接起動する"
	@echo "  ※ 同一 Supabase を共有するため、事前に（リポジトリルートで） make supabase-reset が必要"
	@echo ""
	@echo "  [開発]"
	@echo "  make dev             開発サーバー起動（HTTP  / http://localhost:3001）"
	@echo "  make dev-https       開発サーバー起動（HTTPS / https://localhost:3001）"
	@echo "  make build           プロダクションビルド"
	@echo "  make start           本番サーバー起動"
	@echo ""
	@echo "  [Lint / Format]"
	@echo "  make lint            Biome lint"
	@echo "  make lint-fix        Biome lint (--write)"
	@echo "  make format          Biome format (--write)"
	@echo "  make format-check    Biome format チェックのみ"
	@echo "  make check           Biome check"
	@echo "  make check-fix       Biome check (--write --unsafe)"
	@echo "  make type-check      TypeScript 型チェック"
	@echo ""
	@echo "  [Test]"
	@echo "  make test            単体テスト"
	@echo "  make test-watch      単体テスト (watch)"
	@echo "  make test-coverage   単体テスト + coverage"
	@echo "  make validate        type-check + check + test"
	@echo ""
	@echo "  [セットアップ]"
	@echo "  make cert            SSL証明書を生成（certificates/）"
	@echo "  make clean-cert      SSL証明書を削除"
	@echo "  make clean           SSL証明書を削除"

## SSL証明書を生成（HTTPS 開発用）
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
	@mkdir -p certificates
	@if [ -f certificates/localhost.pem ]; then \
		echo "⚠️  certificates/localhost.pem already exists. Skipping certificate generation."; \
		echo "   To regenerate, run: make clean-cert && make cert"; \
	else \
		mkcert -cert-file certificates/localhost.pem -key-file certificates/localhost-key.pem localhost 127.0.0.1 ::1; \
		echo "✅ SSL certificates generated:"; \
		echo "   - certificates/localhost.pem"; \
		echo "   - certificates/localhost-key.pem"; \
	fi

## SSL証明書のみ削除
clean-cert:
	@echo "🗑️  Removing SSL certificates..."
	rm -f certificates/localhost*.pem
	@echo "✅ Certificates removed."

## クリーンアップ（証明書削除）
clean: clean-cert

## 開発サーバー起動（HTTP）
dev:
	npm run dev

## 開発サーバー起動（HTTPS）。証明書が無ければ自動生成する
dev-https:
	@if [ ! -f certificates/localhost.pem ]; then \
		echo "❌ SSL certificate not found. Running 'make cert'..."; \
		$(MAKE) cert; \
	fi
	npm run dev:https

## プロダクションビルド
build:
	npm run build

## 本番サーバー起動
start:
	npm run start

## Biome lint
lint:
	npm run lint

lint-fix:
	npm run lint:fix

## Biome format
format:
	npm run format

format-check:
	npm run format:check

## Biome check
check:
	npm run check

check-fix:
	npm run check:fix

## TypeScript 型チェック
type-check:
	npm run type-check

## 単体テスト
test:
	npm run test

test-watch:
	npm run test:watch

test-coverage:
	npm run test:coverage

## すべてのチェックを実行
validate:
	npm run validate
