# Implementation Plan: ダイブログ CRUD

**Branch**: `002-dive-log-crud` | **Date**: 2026-06-10 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/002-dive-log-crud/spec.md`

**Note**: 既存仕様書 `docs/specs/features/002-dive-log-crud/design.md` からの移行。

## Summary

認証済みユーザーが自分のダイビングログを作成・閲覧・編集・削除・検索できる CRUD 機能。データは Supabase（PostgreSQL）の `dives` テーブルに保持し、所有者制限は RLS で保証する。一覧の初期表示・詳細表示は Server Components、追加読み込み・検索は TanStack Query、書き込みは Server Actions で行う。フォームは React Hook Form + yup で新規・編集を共有する。

## Technical Context

**Language/Version**: TypeScript（strict mode）/ React 19 / Next.js 16（App Router、React Compiler 有効）

**Primary Dependencies**: React Hook Form + yup（フォーム・バリデーション）、TanStack Query（一覧の追加読み込み・検索）、Tailwind CSS（スタイリング）、`@repo/supabase`（Supabase クライアント）、`@repo/ui`（共通 UI）

**Storage**: Supabase（PostgreSQL）。`public.dives` テーブル + RLS。スキーマ変更はマイグレーション SQL ファイル管理（[data-model.md](data-model.md) 参照）

**Testing**: Vitest（スキーマ・Server Actions・コンポーネント単体 / Storybook テスト）、Playwright（E2E・a11y）

**Target Platform**: Web（モバイル / タブレット / PC、モバイルファースト）

**Project Type**: Web アプリケーション（モノレポ内 `service-front`）

**Performance Goals**: 一覧はページサイズ 20 のキーセットページネーション（`(dive_date, id)` 複合カーソル）で大量ログでも一定コスト。検索入力はデバウンス 300ms

**Constraints**: WCAG 2.1 AA 準拠 / RLS 必須（`public` スキーマ全テーブル）/ `user_id` は Server Action 側で `auth.uid()` から強制セット

**Scale/Scope**: ユーザー 1 人あたり数百〜数千行が想定上限。画面 4 つ（一覧 / 詳細 / 新規作成 / 編集）

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` 準拠（移行時点では `.claude/rules/` のコーディング規約 — `react.md` / `typescript.md` / `html.md` / `css.md` / `sql.md` / `accessibility.md` / `readable-code.md` — を原則として適用）。違反なし。

## Project Structure

### Documentation (this feature)

```text
specs/002-dive-log-crud/
├── spec.md              # 機能仕様
├── plan.md              # This file
├── data-model.md        # dives テーブル定義（カラム・制約・RLS・トリガー）
├── tasks.md             # タスク一覧
└── screens/
    ├── dive-list.md     # 一覧画面仕様
    ├── dive-detail.md   # 詳細画面仕様
    ├── dive-new.md      # 新規作成画面仕様
    └── dive-edit.md     # 編集画面仕様
```

### Source Code (repository root)

```text
supabase/
└── migrations/
    └── 20260525130000_create_dives.sql   # dives テーブル + RLS + インデックス + トリガー

service-front/src/
├── app/(authenticated)/dives/
│   ├── page.tsx                          # 一覧（/dives）
│   ├── new/page.tsx                      # 新規作成（/dives/new）
│   └── [id]/
│       ├── page.tsx                      # 詳細（/dives/[id]）
│       └── edit/page.tsx                 # 編集（/dives/[id]/edit）
└── features/dives/
    ├── components/
    │   ├── client/
    │   │   ├── DiveCard/                 # 一覧の 1 行
    │   │   ├── DiveList/                 # カード並び + ページング
    │   │   ├── DiveForm/                 # 新規・編集で共有
    │   │   ├── DiveSearchBar/            # 検索バー
    │   │   └── DeleteDiveButton/         # 確認ダイアログ付き削除
    │   └── server/
    │       └── DiveDetail/               # 詳細表示（Server Component）
    ├── hooks/
    │   └── useDives.ts                   # TanStack Query（追加読み込み・検索）
    ├── server/
    │   ├── queries.ts                    # 取得系: listDives / getDive / getLatestDiveNumber
    │   └── actions.ts                    # Server Actions: createDive / updateDive / deleteDive
    ├── schemas/
    │   └── dive.schema.ts                # yup スキーマ
    ├── lib/
    │   ├── calcBottomTime.ts             # エントリー / エキジット時刻からの潜水時間自動計算
    │   └── today.ts                      # JST 基準の今日（dive_date デフォルト・上限）
    ├── types.ts
    └── constants.ts                      # dive_type / gas_type / tank_type 等の選択肢
```

**Structure Decision**: モノレポ内の Web フロントエンド `service-front` に Feature-based アーキテクチャで実装する。機能固有コードは `service-front/src/features/dives/` に集約し、ルーティングは `service-front/src/app/(authenticated)/dives/` 配下の Next.js App Router 規約ファイルから feature を呼び出す。各コンポーネントは `<ComponentName>/`（本体 + test + stories + index.ts）の専用フォルダ構成。DB スキーマはリポジトリルートの `supabase/migrations/` で管理する。

> 注: 移行元 design.md ではルートを `src/app/(app)/dives/`、コンポーネントをフラット配置（`components/DiveList.tsx` 等）と記載していたが、実装では route group `(authenticated)` と Client/Server コンポーネント分離フォルダ構成を採用している。本ドキュメントは実装に合わせている。

## Data Model

`dives` テーブルの完全な定義（カラム・制約・インデックス・RLS ポリシー・トリガー・ER）は [data-model.md](data-model.md) を参照。要点:

- PADI ログブックの標準項目を踏襲。必須は `dive_date` / `location` / `max_depth_m` / `bottom_time_min`、他は任意
- `user_id` は `public.users(id)` への FK（`on delete cascade`）
- RLS 有効。所有者のみ全 CRUD 可能（`(select auth.uid()) = user_id`）
- `updated_at` はトリガー `dives_handle_updated_at` で自動更新
- `is_public` / `public_slug` は Phase 2（公開機能）用に先行定義

## Server Actions / クエリ設計

| 場面 | 方法 | 実装 |
|------|------|------|
| 一覧（初期表示） | Server Component | `queries.listDives()` |
| 一覧（追加読み込み・検索） | TanStack Query | `hooks/useDives.ts`（`useDives(filter, initialPage)`） |
| 詳細 | Server Component | `queries.getDive(id)` |
| ダイブ番号初期値 | Server Component | `queries.getLatestDiveNumber()`（過去最大 +1、なければ 1） |
| 作成 | Server Action | `actions.createDive(values)` |
| 更新 | Server Action | `actions.updateDive(id, values)` |
| 削除 | Server Action | `actions.deleteDive(id)` |

- `user_id` は Server Action 側で `auth.uid()` から強制セット（クライアント送信値は無視）
- 更新時の `user_id` 変更は禁止

## バリデーションスキーマ（yup）

必須項目のみ抜粋（移行元 design.md より。完全な項目別バリデーションは [screens/dive-new.md](screens/dive-new.md) を参照）:

```ts
export const diveSchema = yup.object({
  dive_date: yup.date().required(),
  location: yup.string().required(),
  max_depth_m: yup.number().positive().required(),
  bottom_time_min: yup.number().integer().min(1).required(),
  // 任意項目はすべて optional
})
```

実装は `service-front/src/features/dives/schemas/dive.schema.ts`。`dive_date` の上限は JST 基準の今日（`lib/today.ts`）。

## ページネーション

- ページサイズ: 20
- 方式: キーセットページネーション（`(dive_date, id)` の複合カーソル）
- 「もっと見る」クリックで次セットを TanStack Query で取得
- 並び順: `dive_date desc, id desc`
- インデックス `idx_dives_user_id_dive_date` を使用

## 検索

- 入力: `diveNumber`（完全一致） / `diveDate`（完全一致） / `location`（部分一致）
- クエリ: `where user_id = $1 and dive_number = $2 and dive_date = $3 and location ilike $4`
- 並び順: `dive_date desc, id desc`
- 検索条件は URL クエリ（`?diveNumber=&diveDate=&location=`）で保持、入力はデバウンス 300ms

## コンポーネント分割

| コンポーネント | 種別 | 役割 |
|--------------|------|------|
| `DiveCard` | Client | 一覧の 1 行（潜水日 / 場所 / 最大水深 / 潜水時間 / バディ / ダイブ番号） |
| `DiveList` | Client | カード並び + キーセットページング（`role="list"`） |
| `DiveSearchBar` | Client | 日付・ダイブ番号・ポイント名検索（デバウンス 300ms） |
| `DiveForm` | Client | 新規・編集で共有するフォーム（react-hook-form + yup） |
| `DiveDetail` | Server | 詳細のセクション別定義リスト表示 |
| `DeleteDiveButton` | Client | 確認ダイアログ（`role="dialog" aria-modal="true"`）付き削除 |

## アクセシビリティ

- フォームの全 input にラベルを付与
- エラーは `aria-describedby` で input に関連付け
- 削除ダイアログは `role="dialog" aria-modal="true"` でフォーカストラップ
- カードリストは `role="list"` / `role="listitem"`
- 必須フィールドは `aria-required="true"`

画面ごとの詳細要件は各画面仕様（[screens/](screens/)）の「アクセシビリティ要件」節を参照。

## エラーハンドリング

- RLS 違反 / 存在しない id → `notFound()` で 404
- バリデーションエラー → フォームにフィールド単位で表示
- ネットワークエラー → トースト通知

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

違反なし（記載事項なし）。
