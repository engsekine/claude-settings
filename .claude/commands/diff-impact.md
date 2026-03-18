現在のブランチの変更差分を分析し、影響を受けるURLを出力します。

## 使い方

```
/diff-impact [ベースブランチ]
```

- ベースブランチ省略時は `main` との差分

## 手順

### 1. 変更ファイルの取得

```bash
git diff --name-only [ベースブランチ]...HEAD
```

変更ファイルが存在しない場合は「変更差分がありません」と出力して終了。

### 2. 影響URLの特定

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

### 3. 出力フォーマット

```
🔍 影響を受けるURL
═══════════════════════════

ベースブランチ: main
変更ファイル数: 5

影響URL:
• / (全ページ)
• /about
• /blog/*
• /api/users

変更されたファイル:
• app/layout.tsx (グローバル)
• app/about/page.tsx
• app/blog/[slug]/page.tsx
• app/api/users/route.ts
• src/components/Header.tsx (全ページで使用)
```

### 注意事項

- ローカル開発サーバーが起動している場合は、`http://localhost:ポート番号` を含めた完全なURLも出力する
- 動的ルート (`[slug]` など) は `*` で表記する
- コンポーネントの使用箇所は最大10件まで表示し、それ以上は「他N件」と省略する
