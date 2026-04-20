---
name: check-diff-impact
description: 現在のブランチの変更差分を分析し、影響を受けるURLを特定します。
user-invocable: true
---

現在のブランチの変更差分を分析し、影響を受けるURLを特定します。

## 使い方

```
/check:diff-impact [ベースブランチ]
```

ベースブランチ省略時は以下の順で自動検出:
1. 上流ブランチ（`git rev-parse --abbrev-ref @{u}`）
2. `main` からの派生点（`git merge-base --fork-point main HEAD`）
3. `develop` からの派生点
4. デフォルト `main`

## 手順

### 1. ベースブランチの決定と変更ファイルの取得

```bash
# ベースブランチ検出（引数がない場合）
UPSTREAM=$(git rev-parse --abbrev-ref @{u} 2>/dev/null)
# 上流があればそれを使用、なければ main

# 変更ファイル取得
git diff HEAD --name-only         # 未コミットの変更
git diff <ベース>...HEAD --name-only  # コミット済みの変更
```

全てで変更ファイルが存在しない場合は「変更差分がありません」と出力して終了。

**出力**: 変更ファイルパスのリスト（重複排除済み）→ 手順2の入力

### 2. 影響URLの特定

変更ファイルのパスから、影響を受けるURLを特定する。

#### ページファイルの場合（直接的な影響）

| ファイルパス | 影響URL |
|------------|---------|
| `app/page.tsx` | `/` |
| `app/about/page.tsx` | `/about` |
| `app/blog/[slug]/page.tsx` | `/blog/*` |
| `app/blog/[...slug]/page.tsx` | `/blog/**` |
| `app/(group)/dashboard/page.tsx` | `/dashboard`（route group は URL に含まない） |
| `app/api/users/route.ts` | `/api/users` |
| `pages/index.tsx` | `/`（Pages Router） |
| `pages/about.tsx` | `/about`（Pages Router） |

**動的ルートの表記**: `[slug]` → `*`、`[...slug]` → `**`

#### コンポーネント・ユーティリティの場合（間接的な影響）

変更されたファイルを import しているファイルを逆引きする:

```bash
# 変更ファイル名（拡張子なし）で import を検索
grep -r "from.*<変更ファイル名>" src/ app/ --include="*.tsx" --include="*.ts" -l
```

検索結果がページファイル（`page.tsx`, `route.ts`）であればそのURLを追加。
ページファイルでなければ、さらにそのファイルを import しているファイルを検索する（**最大3段階まで**）。

#### グローバル影響（全ページに影響）

以下のファイルが変更された場合は「全ページに影響」と判定:
- `app/layout.tsx`（ルートレイアウト）
- `app/template.tsx`
- `src/middleware.ts` / `middleware.ts`
- `app/globals.css` / `src/styles/**/*.css`
- `tailwind.config.*`
- `next.config.*`
- `pages/_app.tsx`, `pages/_document.tsx`（Pages Router）

**出力**: 影響URL一覧 → 手順3の入力

### 3. 出力フォーマット

```
変更差分の影響分析
═══════════════════════════════
ベースブランチ: <検出されたブランチ名>

## 影響を受けるURL

- <URL>（<影響元ファイル>）
- ...

### グローバル影響
<あり（対象ファイル名） or なし>

## 変更ファイル → URL 対応

| ファイル | 影響URL | 影響種別 |
|---------|---------|---------|
| `app/about/page.tsx` | `/about` | 直接 |
| `src/components/Header.tsx` | 全ページ | 間接（layout.tsx 経由） |

## サマリー
影響URL: <件数>件
変更ファイル: <件数>件
グローバル影響: <あり or なし>
```

### 4. 確認用URL

```
## 確認用URL (localhost:3000)
- http://localhost:3000/<URL>
- ...
```

ポート番号は `package.json` の `scripts.dev` から自動検出を試み、見つからなければ `3000` を使用。

## 除外設定

以下のファイルはチェック対象外:
- `package-lock.json`, `yarn.lock`, `pnpm-lock.yaml`
- `node_modules/**`, `dist/**`, `build/**`, `.next/**`
- バイナリファイル（画像、フォントなど）
