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

このリポジトリはダイビングログアプリのモノレポを兼ねています。**各サービスの詳細なセットアップ手順はそれぞれのディレクトリの README に集約**されており、ここでは全体像と起動順序だけをまとめます。

| ディレクトリ | 内容 | 起動ポート | セットアップ詳細 |
|-------------|------|-----------|----------------|
| `supabase/` | ローカル Supabase（Auth / PostgreSQL / Storage）の設定・マイグレーション・seed | 54321（API）/ 54322（DB）/ 54323（Studio） | [supabase/README.md](supabase/README.md) |
| `service-front/` | ユーザー向けアプリ（Next.js App Router）。Docker で起動 | 3000 | [service-front/README.md](service-front/README.md) |
| `admin-front/` | 運営管理画面（Next.js）。npm で直接起動 | 3001 | [admin-front/README.md](admin-front/README.md) |
| `packages/` | 共有パッケージ（`@repo/ui` / `@repo/supabase`） | - | - |

### 前提ツール

| ツール | 用途 | インストール（macOS） |
|--------|------|----------------------|
| Node.js 24 | ランタイム（`package.json` の volta 設定でピン留め） | `curl https://get.volta.sh \| bash` → 自動で 24 系が入る |
| Docker Desktop | Supabase スタック / service-front の起動 | [公式サイト](https://www.docker.com/products/docker-desktop/) |
| Supabase CLI | ローカル BaaS の起動・マイグレーション | `brew install supabase/tap/supabase` |
| mkcert | ローカル HTTPS 証明書 | `brew install mkcert` |
| Stripe CLI | ログ枠購入（026）の webhook 転送。**任意** | `brew install stripe/stripe-cli/stripe` |

### 起動順序（クイックスタート）

Supabase → service-front → admin-front の順に立ち上げます。

```bash
# 1. 依存パッケージ（ルートで 1 回。workspaces 全体に反映）
npm install

# 2. Supabase の起動と DB 構築
#    事前に supabase/.env と supabase/.env.local の作成が必要
#    → 詳細: supabase/README.md（環境変数 / 初期データ）
supabase start
make supabase-reset

# 3. service-front（ユーザー向けアプリ → http://localhost:3000）
#    事前に service-front/.env の作成が必要 → 詳細: service-front/README.md
make front-setup   # 初回のみ
make front-dev

# 4. admin-front（運営管理画面 → http://localhost:3001）
#    → 詳細: admin-front/README.md
make admin-cert    # 初回のみ
make admin-dev
```

- ログ枠購入（Stripe 決済）を動かす場合の設定・**テスト用カード番号**は [service-front/README.md の「Stripe の設定」](service-front/README.md#stripe-の設定ログ枠購入--026) を参照
- 各サービスの make コマンド一覧は `make help`（ルート / 各ディレクトリ）で確認できます

---

