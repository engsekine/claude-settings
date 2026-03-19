現在のブランチの変更差分を分析し、影響を受けるURLを特定します。

## 使い方

```
/check:diff-impact [ベースブランチ]
```

- ベースブランチ省略時は、以下の順で自動検出:
  1. 現在のブランチの上流ブランチ（`git rev-parse --abbrev-ref @{u}`）
  2. 上流が無ければ、ブランチの派生元（`git merge-base --fork-point main HEAD` または `develop`）
  3. それも無ければ `main` ブランチとの差分
- 常に以下の3つの状態を全てチェックします:
  1. ステージング済みの変更（`--cached`）
  2. 未ステージの変更（working directory）
  3. コミット前の全変更（`HEAD` との差分）

## 手順

### 1. ベースブランチの自動検出

ベースブランチが指定されていない場合、以下の順で検出を試みる:

```bash
# 1. 上流ブランチを取得
UPSTREAM=$(git rev-parse --abbrev-ref @{u} 2>/dev/null)
if [ -n "$UPSTREAM" ]; then
  BASE_BRANCH="$UPSTREAM"
else
  # 2. main ブランチからの派生点を検出
  FORK_POINT=$(git merge-base --fork-point main HEAD 2>/dev/null)
  if [ -n "$FORK_POINT" ]; then
    BASE_BRANCH="$FORK_POINT"
  else
    # 3. develop ブランチからの派生点を検出
    FORK_POINT=$(git merge-base --fork-point develop HEAD 2>/dev/null)
    if [ -n "$FORK_POINT" ]; then
      BASE_BRANCH="$FORK_POINT"
    else
      # 4. デフォルトで main ブランチ
      BASE_BRANCH="main"
    fi
  fi
fi
```

検出されたベースブランチは出力に表示する。

### 2. 変更ファイルの取得

以下の3つのコマンドを全て実行し、それぞれの結果を取得:

```bash
# 1. ステージング済みの変更
git diff --name-only --cached

# 2. 未ステージの変更
git diff --name-only

# 3. コミット前の全変更（HEAD との差分）
git diff --name-only HEAD
```

全ての状態で変更ファイルが存在しない場合のみ「変更差分がありません」と出力して終了。

### 3. 影響URLの特定

変更ファイルの種類に応じて、影響を受けるURLを特定する。

#### Next.js App Router の場合

- `app/**/page.tsx` → `/対応するルート`
- `app/**/layout.tsx` → `/対応するルート` 配下全て
- `app/api/**/route.ts` → `/api/対応するルート`

例:
- `app/about/page.tsx` → `/about`
- `app/blog/[slug]/page.tsx` → `/blog/*`
- `app/layout.tsx` → `/` (全ページ)

#### Next.js Pages Router の場合

- `pages/index.tsx` → `/`
- `pages/about.tsx` → `/about`
- `pages/blog/[slug].tsx` → `/blog/*`
- `pages/api/*` → `/api/*`

#### コンポーネントの場合

- `src/components/**` → そのコンポーネントが使われているページ
  - Grep で `import` 文を検索して使用箇所を特定
  - 使用箇所がページファイルなら、そのURLを追加

#### グローバルな変更

以下のファイルが変更された場合は「全ページに影響」と出力:
- `app/layout.tsx` (App Router のルートレイアウト)
- `pages/_app.tsx` (Pages Router)
- `pages/_document.tsx`
- `src/styles/**/*.css`
- `tailwind.config.*`
- `globals.css`

### 4. 出力フォーマット

```
🔍 変更差分の影響分析
═══════════════════════════════
ベースブランチ: origin/main

## 📋 ステージング済みの変更
変更ファイル数: 3

## 📝 未ステージの変更
変更ファイル数: 5

## 📦 コミット前の全変更（HEAD との差分）
変更ファイル数: 8

## 影響を受けるURL

• / (全ページ)
• /about
• /blog/*
• /api/users

### 変更されたファイル

• app/layout.tsx (グローバル)
• app/about/page.tsx → /about
• app/blog/[slug]/page.tsx → /blog/*
• app/api/users/route.ts → /api/users
• src/components/Header.tsx (全ページで使用)

## 影響範囲サマリー

📍 影響URL: 4件
📄 変更ファイル: 8件
⚠️  グローバル影響: あり
```

### 5. 追加情報

ローカル開発サーバーが起動している場合は、確認用の完全なURLも出力:

```
## 確認用URL (localhost:3000)

• http://localhost:3000/
• http://localhost:3000/about
• http://localhost:3000/blog/example
• http://localhost:3000/api/users
```

## 除外設定

以下のファイルはチェック対象外:
- `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `node_modules/**`
- `dist/**`, `build/**`, `.next/**`
- バイナリファイル (画像、フォントなど)

## 注意事項

- 動的ルート (`[slug]` など) は `*` で表記する
- コンポーネントの使用箇所は最大10件まで表示し、それ以上は「他N件」と省略する
- ローカル開発サーバーのポート番号は `package.json` の `scripts` から自動検出を試みる
