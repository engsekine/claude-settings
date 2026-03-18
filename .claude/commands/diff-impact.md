現在のブランチの変更差分を分析し、影響を受けるURLとタイポ・不要な文字変更をチェックします。

## 使い方

```
/diff-impact [ベースブランチ]
/diff-impact --staged    # ステージング済みの変更のみ
/diff-impact --unstaged  # 未ステージの変更のみ
/diff-impact --working   # コミット前の全変更（ステージング+未ステージ）
```

- ベースブランチ省略時は `main` との差分
- `--staged`: ステージング済みの変更のみをチェック
- `--unstaged`: 未ステージの変更のみをチェック
- `--working`: コミット前の全変更をチェック（ステージング済み + 未ステージ）

## 手順

### 1. 変更ファイルの取得

引数に応じて使用するコマンドを切り替え:

```bash
# ブランチ間の差分
git diff --name-only [ベースブランチ]...HEAD

# ステージング済みの変更のみ
git diff --name-only --cached

# 未ステージの変更のみ
git diff --name-only

# コミット前の全変更
git diff --name-only HEAD
```

変更ファイルが存在しない場合は「変更差分がありません」と出力して終了。

### 2. タイポ・不要な文字変更チェック

#### タイポチェック

**よくあるタイポパターン:**
- スペルミス: `fucntion` → `function`, `consoel` → `console`
- 全角/半角混在: `　` (全角スペース), `０-９` (全角数字)
- 引用符の誤用: `'` vs `'` (シングルクォート vs バッククォート)
- ダブルクォートの混在: `"` vs `"` (半角 vs 全角)

**チェック対象:**
- 変数名・関数名のスペルミス
- コメント内の誤字脱字
- 文字列リテラル内のタイポ
- import文のパス誤り

#### 不要な文字変更チェック

**検出パターン:**
- 末尾の空白追加/削除のみ
- 改行コードの変更のみ (LF ↔ CRLF)
- インデントの不要な変更 (タブ ↔ スペース)
- 空行の追加/削除のみ
- コメントアウトの追加/削除のみ

**除外条件 (意図的な変更として許可):**
- フォーマッター適用 (Prettier, ESLint --fix)
- リファクタリングに伴う変更
- コーディング規約への準拠

#### 不要な変更の検出

引数に応じてコマンドを切り替え:

```bash
# ブランチ間の差分
git diff -w [ベースブランチ]...HEAD

# ステージング済み
git diff -w --cached

# 未ステージ
git diff -w

# コミット前の全変更
git diff -w HEAD
```

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

対象: main との差分 (または --staged / --unstaged / --working)
変更ファイル数: 8

## タイポの可能性

### src/utils/helper.ts:15
❌ fucntion → function
   const fucntion = () => {}

### src/components/Button.tsx:32
⚠️  全角スペースが含まれています
   const　name = "button"

## 不要な文字変更

### src/types/index.ts
ℹ️  末尾の空白のみの変更 (3箇所)
   - 12行目: 末尾スペース追加
   - 25行目: 末尾スペース削除
   - 38行目: 末尾スペース追加

### src/styles/globals.css
ℹ️  空行のみの変更 (2箇所)
   - 45行目: 空行追加
   - 67行目: 空行削除

## 表記ゆれ

### ユーザー vs ユーザ
- src/pages/user.tsx:10 → ユーザー
- src/components/UserList.tsx:5 → ユーザ
推奨: 統一が必要

## 影響を受けるURL

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

## チェック結果サマリー

✅ タイポ: 2件
⚠️  不要な変更: 5箇所
ℹ️  表記ゆれ: 1件
📍 影響URL: 4件

合計: 8件の確認事項
```

### 5. 修正提案

問題が見つかった場合:
1. タイポは自動修正を提案
2. 不要な変更は削除を提案
3. 表記ゆれは統一ルールを提案

## 除外設定

以下のファイルはチェック対象外:
- `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `node_modules/**`
- `dist/**`, `build/**`, `.next/**`
- バイナリファイル (画像、フォントなど)

## 注意事項

- プロジェクト固有の用語は `.vscode/settings.json` の `cSpell.words` を参照
- 意図的な変更とタイポの区別が難しい場合は警告レベルで報告
- 自動修正は提案のみ、実行は確認後に行う
- ローカル開発サーバーが起動している場合は、`http://localhost:ポート番号` を含めた完全なURLも出力する
- 動的ルート (`[slug]` など) は `*` で表記する
- コンポーネントの使用箇所は最大10件まで表示し、それ以上は「他N件」と省略する
