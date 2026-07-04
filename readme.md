# claudeの最適設定を研究するリポジトリ

## セットアップ

このリポジトリのコマンド・スキル・エージェント設定をグローバルの Claude に反映するには、シンボリックリンクを作成します。

```bash
make link
```

`~/.claude/skills`, `~/.claude/agents`, `~/.claude/rules` がこのリポジトリの `.claude/` 配下にリンクされます。

### その他の make コマンド

| コマンド | 説明 |
|---------|------|
| `make link` | グローバル `~/.claude/` へシンボリックリンクを作成 |
| `make unlink` | シンボリックリンクを削除 |
| `make re` | リンクし直す（unlink → link） |
| `make status` | 現在のリンク状態を確認 |

### devcontainer で使う

以下のコマンドを実行すると、プロジェクトの `.devcontainer/devcontainer.json` にコピペできる `mounts` 設定が出力されます。

```bash
make devcontainer
```

出力された JSON を `.devcontainer/devcontainer.json` の `mounts` に追加してください。

> コンテナのユーザーが `root` 以外（例: `vscode`, `node`）の場合は `target` のパスを変更してください。
> 例: `target=/home/vscode/.claude/skills,...`

#### `devcontainer.json` の変更をgitに追わせない

`mounts` はホストのパスが含まれるため人によって異なります。チームでリポジトリを共有している場合は、ローカルの変更をgitに追跡させない設定が便利です。

```bash
git update-index --skip-worktree .devcontainer/devcontainer.json
```

これにより `devcontainer.json` への変更が `git diff` や `git status` に表示されなくなります。

解除する場合:

```bash
git update-index --no-skip-worktree .devcontainer/devcontainer.json
```

> **`.gitignore` との違い**: `skip-worktree` はすでにgit管理されているファイルのローカル変更を無視します。チームのベース設定はgitで共有しつつ、個人のmounts設定だけを追跡対象から外したい場合に使います。

#### 未追跡ファイルをローカルでだけ除外する（`.git/info/exclude`）

`.gitignore` をリポジトリにコミットしたくない場合や、自分だけのローカルルールを追加したい場合は `.git/info/exclude` に記述します。

```bash
# .git/info/exclude に追記
echo ".devcontainer/devcontainer.json" >> .git/info/exclude
```

`.gitignore` と同じ記法で書けますが、このファイル自体はgit管理されないためチームに影響しません。

| 方法 | 対象ファイルの状態 | チームへの影響 |
|------|-----------------|--------------|
| `.gitignore` | 未追跡ファイル | あり（gitで共有） |
| `.git/info/exclude` | 未追跡ファイル | なし（ローカルのみ） |
| `skip-worktree` | すでにgit管理されているファイル | なし（ローカルのみ） |

---

## Web サービス全体の環境構築

このリポジトリはダイビングログアプリのモノレポを兼ねています。構成は以下のとおりです。

| ディレクトリ | 内容 | 起動ポート |
|-------------|------|-----------|
| `service-front/` | ユーザー向けアプリ（Next.js App Router）。Docker で起動 | 3000 |
| `admin-front/` | 運営管理画面（Next.js）。npm で直接起動 | 3001 |
| `supabase/` | ローカル Supabase（Auth / PostgreSQL / Storage）の設定・マイグレーション・seed | 54321（API）/ 54322（DB）/ 54323（Studio） |
| `packages/` | 共有パッケージ（`@repo/ui` / `@repo/supabase`） | - |

### 前提ツール

| ツール | 用途 | インストール（macOS） |
|--------|------|----------------------|
| Node.js 24 | ランタイム（`package.json` の volta 設定でピン留め） | `curl https://get.volta.sh \| bash` → 自動で 24 系が入る |
| Docker Desktop | Supabase スタック / service-front の起動 | [公式サイト](https://www.docker.com/products/docker-desktop/) |
| Supabase CLI | ローカル BaaS の起動・マイグレーション | `brew install supabase/tap/supabase` |
| mkcert | ローカル HTTPS 証明書（`make front-setup` / `make admin-cert` が使用） | `brew install mkcert` |
| Stripe CLI | ログ枠購入（026）の webhook 転送。**任意**（決済を触らないなら不要） | `brew install stripe/stripe-cli/stripe` |

### 1. 依存パッケージのインストール

```bash
npm install
```

ルートで 1 回実行すれば、npm workspaces（`packages/*` / `service-front` / `admin-front`）すべてに反映されます。

### 2. 環境変数ファイルの作成

| 作成するファイル | コピー元 | 内容 |
|-----------------|---------|------|
| `supabase/.env` | `supabase/.env.example` | `config.toml` の `env()` が読む値。**`SMTP_ENABLED` は未定義だと `supabase start` がエラーになるため必須**（ローカルは `false` 推奨 = メールは Mailpit が捕捉） |
| `supabase/.env.local` | `supabase/.env.example` | seed 生成（envsubst）用のテストユーザー認証情報（`TEST_USER_*`）と Google OAuth キー |
| `service-front/.env` | `service-front/.env.example` | Supabase の URL / anon key（`supabase status` で表示される値）、Stripe キー（決済を使う場合のみ） |

### 3. Supabase の起動と DB 構築

```bash
supabase start        # 全コンテナ起動（初回はイメージ取得で数分）
make supabase-reset   # seed.sql 生成 + マイグレーション適用 + seed 投入
```

- `supabase/seed.sql` は **`seed.sql.template` から `make supabase-seed` で生成される成果物**です。seed を変更するときは template 側を編集してください
- Studio（DB の GUI）: http://127.0.0.1:54323 / 送信メールの確認（Mailpit）: http://127.0.0.1:54324
- CLI の詳細な操作・マイグレーション運用は [supabase/README.md](supabase/README.md) を参照

### 4. service-front（ユーザー向けアプリ）の起動

```bash
make front-setup   # 初回のみ: SSL 証明書生成 + Docker 内で npm install
make front-dev     # 開発サーバー起動 → http://localhost:3000
```

- HTTPS で起動する場合は `make front-dev-https`
- ログインは seed のテストユーザー（`supabase/.env.local` の `TEST_USER_EMAIL` / `TEST_USER_PASSWORD`）を使用

### 5. admin-front（運営管理画面）の起動

```bash
make admin-cert    # 初回のみ: SSL 証明書生成
make admin-dev     # 開発サーバー起動 → http://localhost:3001
```

- service-front と同一の Supabase を共有するため、**事前に `make supabase-reset`（管理者 seed 投入）が必要**です
- ログインは seed の管理者（`admin@example.com` / `admin-password`。local 専用）

### 6. Stripe（ログ枠購入を動かす場合のみ）

```bash
stripe login
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

- 出力される `whsec_...` を `service-front/.env` の `STRIPE_WEBHOOK_SECRET` に、ダッシュボード（テストモード）の `sk_test_...` を `STRIPE_SECRET_KEY` に設定
- 決済はテストカード `4242 4242 4242 4242` で確認できます

### よく使う開発コマンド

| コマンド | 説明 |
|---------|------|
| `make front-test` | service-front の Vitest 単体テスト |
| `make front-test-e2e` | Playwright E2E テスト |
| `make front-validate` | lint + 型チェック + テストの一括実行 |
| `make front-storybook` | Storybook 起動 |
| `make admin-validate` | admin-front の一括チェック |
| `make supabase-migration-up` | 未適用マイグレーションのみ適用（データ保持） |
| `make help` | 全コマンドの一覧 |

---

