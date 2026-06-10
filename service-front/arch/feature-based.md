# Feature-based アーキテクチャ

service-front は機能（feature）単位でコードを分割する Feature-based アーキテクチャを採用する。本ドキュメントは実装規約の正であり、新規コード作成時は必ずこの構造に従う。

## ディレクトリ構成

```
src/
├── app/          # Next.js App Router（ルーティング・レイアウトのみ）
├── features/     # 機能単位のモジュール
├── shared/       # 複数 feature で共有する横断コード
└── lib/          # 汎用ユーティリティ（cn 等、ドメイン非依存）
```

### app/ — ルーティング層

- ルートグループで認証要件を表現する: `(auth)` 未認証専用 / `(authenticated)` 要認証 / `(public)` 公開
- `page.tsx` は **feature の公開 API を呼び出すだけ** にする。データ変換・ビジネスロジックを書かない（変換が必要なら feature の `lib/mappers.ts` に置く）
- `metadata` は `generatePageMetadata`（`@/shared/config/metadata`）で必ずエクスポートする

### features/<name>/ — 機能モジュール

```
features/<name>/
├── index.ts        # 公開 API（バレル）。外部はここからのみ import する
├── components/
│   ├── client/     # 'use client' コンポーネント（1 コンポーネント 1 フォルダ）
│   └── server/     # Server Components
├── hooks/          # client hooks（use プレフィックス）
├── schemas/        # yup スキーマ（*.schema.ts）
├── server/         # Server Actions（actions.ts）・データ取得（queries.ts）・mappers/
├── lib/            # feature 内ロジック（クエリビルダー・変換関数等）
├── stores/         # 状態管理（必要な場合のみ）
├── constants.ts
└── types.ts
```

### shared/ — 横断コード

| パス | 内容 |
|---|---|
| `shared/components/layout/` | Header / Footer / Breadcrumbs |
| `shared/components/form/` | FormField / FormSelect / FormTextarea / FormRadioGroup（フォーム UI の共通部品） |
| `shared/schemas/` | yup の共有フィールド定義・transform・パターン |
| `shared/types/` | `ActionResult` 等の共有型 |
| `shared/lib/` | supabase クライアント・react-query・date / number ユーティリティ |
| `shared/config/` | metadata 等の設定 |
| `shared/constants/` | 複数 feature で使う定数 |

## 依存ルール

1. **feature 間の直接 import 禁止**。共有したいコードは `shared/` に昇格させる
2. 外部（app/ 等）からは **feature の `index.ts` 経由でのみ** import する（`@/features/dives` ○ / `@/features/dives/server/queries` ×）
3. feature → shared への依存は自由。shared → feature への依存は禁止
4. コンポーネント内部の sibling 参照は親ディレクトリ経由（`../Bar` で隣のフォルダの index.ts を解決）

## コンポーネント規約

- 1 コンポーネント 1 フォルダ: `<Name>/<Name>.tsx` + `<Name>.test.tsx` + `<Name>.stories.tsx` + `index.ts`（詳細は `.claude/CLAUDE.md` の「コンポーネント作成時のフォルダ構成」）
- Server Components をデフォルトとし、`components/client/` 配下のみ `'use client'` を付ける
- フォームの入力フィールドは `@/shared/components/form` の共通コンポーネントを使う（label + Input + エラー表示を手書きしない）
- react-hook-form の `register` / `control` オブジェクトを Props として子に渡さない（`register()` の戻り値 spread は可）

## データ層規約

- **Server Actions**（mutation）: 戻り値は `ActionResult<T>`（`@/shared/types/action-result`）で統一。認証チェック（`auth.getUser()`）を必ず行う
- **queries.ts**（SSR データ取得）: Supabase エラーは throw して error.tsx に委ねる。「データなし」（404 セマンティクス）のみ null を返す
- **クライアントフェッチ**（hooks）と queries.ts で同じクエリを使う場合、クエリビルダー・カラムリスト・row 変換は feature の `lib/` に置き、両者で共有する（二重実装禁止）
- DB row 型は `Database['public']['Tables'][...]`（`@repo/supabase` の生成型）を使う。手書きの row 型を作らない
- numeric カラムの string 化は `toNumber`（`@/shared/lib/number`）で吸収する

## packages/（ワークスペース）

| パッケージ | 内容 |
|---|---|
| `@repo/ui` | Button / Input 等の UI プリミティブ |
| `@repo/supabase` | browser / server / middleware 用クライアントと生成型 Database |

Supabase クライアントは直接 `@supabase/ssr` を使わず、必ず `@repo/supabase`（または `@/shared/lib/supabase`）経由で取得する（認証 Cookie 名の統一のため）。
