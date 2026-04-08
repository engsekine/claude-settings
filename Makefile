REPO_DIR := $(shell pwd)
CLAUDE_DIR := $(HOME)/.claude

CLAUDE_TARGETS := commands skills agents rules

.PHONY: link unlink re status help

## グローバルの ~/.claude に対してシンボリックリンクを作成する
link:
	@echo "Linking to $(CLAUDE_DIR)/"
	@for target in $(CLAUDE_TARGETS); do \
		src="$(REPO_DIR)/.claude/$$target"; \
		dst="$(CLAUDE_DIR)/$$target"; \
		if [ ! -d "$$src" ]; then \
			echo "  skip  $$target (source not found)"; \
			continue; \
		fi; \
		if [ -L "$$dst" ]; then \
			echo "  skip  $$target (already linked)"; \
		elif [ -e "$$dst" ]; then \
			echo "  skip  $$target ($$dst already exists — remove it manually to link)"; \
		else \
			ln -s "$$src" "$$dst"; \
			echo "  linked $$target -> $$dst"; \
		fi; \
	done
	@echo "Done."

## シンボリックリンクを削除する
unlink:
	@echo "Unlinking from $(CLAUDE_DIR)/"
	@for target in $(CLAUDE_TARGETS); do \
		dst="$(CLAUDE_DIR)/$$target"; \
		if [ -L "$$dst" ]; then \
			rm "$$dst"; \
			echo "  removed $$target"; \
		else \
			echo "  skip  $$target (not a symlink)"; \
		fi; \
	done
	@echo "Done."

## unlink してから link し直す
re: unlink link

## リンク状態を確認する
status:
	@echo "Symlink status in $(CLAUDE_DIR)/"
	@for target in $(CLAUDE_TARGETS); do \
		dst="$(CLAUDE_DIR)/$$target"; \
		if [ -L "$$dst" ]; then \
			echo "  [linked] $$target -> $$(readlink $$dst)"; \
		elif [ -d "$$dst" ]; then \
			echo "  [dir]    $$target (real directory, not linked)"; \
		else \
			echo "  [none]   $$target"; \
		fi; \
	done

## devcontainer.json に追加する mounts 設定を出力する
devcontainer:
	@rel=$$(echo "$(REPO_DIR)" | sed "s|^$(HOME)/||"); \
	printf 'Add the following "mounts" to your .devcontainer/devcontainer.json:\n\n'; \
	printf '{\n'; \
	printf '  "mounts": [\n'; \
	targets="$(CLAUDE_TARGETS)"; \
	last=$$(echo $$targets | tr ' ' '\n' | tail -1); \
	for target in $$targets; do \
		entry="\"source=\$${localEnv:HOME}/$$rel/.claude/$$target,target=/home/node/.claude/$$target,type=bind,consistency=cached\""; \
		if [ "$$target" = "$$last" ]; then \
			printf '    %s\n' "$$entry"; \
		else \
			printf '    %s,\n' "$$entry"; \
		fi; \
	done; \
	printf '  ]\n'; \
	printf '}\n'

## service-front
front-setup:
	$(MAKE) -C service-front setup

front-dev:
	$(MAKE) -C service-front dev

front-dev-https:
	$(MAKE) -C service-front dev-https

front-build:
	$(MAKE) -C service-front build

front-test:
	$(MAKE) -C service-front test

front-lint:
	$(MAKE) -C service-front lint

front-format:
	$(MAKE) -C service-front format

front-validate:
	$(MAKE) -C service-front validate

front-clean:
	$(MAKE) -C service-front clean

help:
	@echo "Usage:"
	@echo ""
	@echo "  [symlink]"
	@echo "  make link             グローバル ~/.claude へシンボリックリンクを作成"
	@echo "  make unlink           シンボリックリンクを削除"
	@echo "  make re               リンクし直す (unlink + link)"
	@echo "  make status           リンク状態を確認"
	@echo ""
	@echo "  [service-front]"
	@echo "  make front-setup      初回セットアップ"
	@echo "  make front-dev        開発サーバー起動（HTTP）"
	@echo "  make front-dev-https  開発サーバー起動（HTTPS）"
	@echo "  make front-build      プロダクションビルド"
	@echo "  make front-test       テスト実行"
	@echo "  make front-lint       Lint実行"
	@echo "  make front-format     フォーマット実行"
	@echo "  make front-validate   すべてのチェックを実行"
	@echo "  make front-clean      クリーンアップ"
