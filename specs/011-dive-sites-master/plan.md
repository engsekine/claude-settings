# Implementation Plan: ダイブサイト（ポイント）マスタ

**Branch**: `011-dive-sites-master` | **Date**: 2026-06-16 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/011-dive-sites-master/spec.md`

## Summary

ダイビングのポイントを表す共有マスタ `dive_sites` を新設し、ダイブログ記録時に **検索して選択** するか **従来どおり自由入力** するか（排他・同居）でポイントを指定できるようにする。サイトに紐づくログから、利用者本人の「潜水本数・平均透明度・月別本数のベストシーズン」を **ダイブサイト詳細ページ** で表示する。マスタ参照ログは表示名をマスタから引くため表記ゆれが根絶される。マスタの追加・編集・統合（US3）は別機能「管理画面」+ 管理者ロールの前提に依存するため本機能ではスコープ外とし、初期データは `seed.sql` で投入する。導出値（実績）は保存しない。

## Technical Context

**Language/Version**: TypeScript（strict mode）/ React 19 / Next.js 16（App Router、React Compiler 有効）

**Primary Dependencies**: React Hook Form + yup（フォーム・バリデーション）、Tailwind CSS、`@repo/supabase`（Supabase クライアント）、`@repo/ui`（共通 UI）。新規ライブラリは追加しない（検索選択 UI は自前の Server/Client コンポーネントで実装 — [research.md R2](research.md)）

**Storage**: Supabase（PostgreSQL）。新規 `public.dive_sites`（共有マスタ）+ 既存 `public.dives` への `dive_site_id` 追加。スキーマはマイグレーション SQL 管理（[data-model.md](data-model.md)）

**Testing**: Vitest（yup スキーマ・サイト実績計算 `siteStats.ts`・表示名解決の純粋関数・Server Actions）、Storybook（story + テスト）、Playwright（a11y）

**Target Platform**: Web（モバイル / タブレット / PC、モバイルファースト）

**Project Type**: Web アプリケーション（モノレポ内 `service-front`）

**Performance Goals**: ダイブサイトは高々数百件程度を想定し、選択 UI は全件取得 + クライアント側インクリメンタル絞り込みで十分（[research.md R2](research.md)）。サイト実績は本人のログ（1 サイトあたり高々数十件）を 1 クエリで取得し純粋関数で集計

**Constraints**: WCAG 2.1 AA 準拠（検索選択はコンボボックス WAI-ARIA パターン）/ RLS 必須（`dive_sites` は authenticated に SELECT 許可、書き込みは seed / service role のみ）/ `dives` はサイト参照と自由入力の **排他**（DB CHECK で担保）/ 既存ログは無変更で互換

**Scale/Scope**: ダイブサイト 数百件・1 ユーザーのサイト別ログは数十件規模。画面: ダイブサイト詳細 1 画面追加 + 既存ダイブログ作成/編集/詳細/一覧の改修

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 準拠 | 確認内容 |
|------|------|---------|
| I. Spec-Driven Development | ✅ | spec.md 承認済み・Clarifications 反映済み。本 plan → tasks → 実装の順で進める |
| II. Server Components First | ✅ | ダイブサイト詳細（DiveSiteDetail）・実績集計は Server Component / Server 側クエリ。Client は検索選択コンボボックス（SearchSelect）の最小範囲。ページは `generatePageMetadata` を使用 |
| III. Test-First | ✅ | `siteStats.ts`（実績集計）・サイト表示名解決・yup スキーマ・Server Actions のテストを実装より先に書く。新規コンポーネントは `/generate-with-tests` で test / story / a11y を同梱 |
| IV. Security & RLS by Default | ✅ | `dive_sites` に RLS 有効化（SELECT は authenticated、書き込みポリシーは設けず seed / service role のみ）。`dives.dive_site_id` 追加は既存 RLS（本人のみ）に乗る。マイグレーションファイル経由のみ。FK / トリガ関数は `set search_path = ''` |
| V. Accessibility | ✅ | 検索選択はラベル関連付け・`role="combobox"` / `aria-expanded` / `aria-controls` / リストボックス・キーボード操作。サイト名リンク・空状態に配慮。Playwright + axe-core で検証 |
| VI. Coding Standards | ✅ | snake_case / text + CHECK / timestamptz / FK は `*_id` + インデックス / 3NF（サイト名は `dive_site_id` に従属させ冗長保存しない）。Feature-based 構成・コンポーネントフォルダ規約に準拠 |

**Phase 1 設計後の再評価**: 違反なし。サイト名をログに冗長保存しない（表示名はマスタ参照）方針は sql.md の 2NF/3NF・「計算可能な値を冗長に保存しない」に適合。共有マスタの書き込みを RLS で塞ぎ seed 管理にする判断は、管理者ロール未導入という現状制約に対する最小・安全な選択（Complexity Tracking 不要）。

## Project Structure

### Documentation (this feature)

```text
specs/011-dive-sites-master/
├── spec.md              # 機能仕様（Clarifications 済み）
├── plan.md              # This file
├── research.md          # Phase 0: 設計判断の記録
├── data-model.md        # dive_sites 定義 + dives 改修（カラム・制約・RLS・インデックス）
├── quickstart.md        # 動作検証手順
├── checklists/
│   └── requirements.md  # spec 品質チェックリスト
└── tasks.md             # Phase 2 出力（/speckit-tasks で生成 — 本コマンドでは作らない）
```

`contracts/` は作成しない。外部公開 API はなく、インターフェースは Server Actions / Server クエリ（`features/*/server/`）に閉じるため、入出力は data-model.md と本ファイルで定義する。

### Source Code (repository root)

```text
supabase/
├── migrations/
│   ├── <ts>_create_dive_sites.sql          # dive_sites テーブル + RLS(SELECT) + トリガ + 一意制約
│   └── <ts>_add_dives_dive_site_id.sql     # dives に dive_site_id 追加 / location を nullable 化 / 排他 CHECK / インデックス
└── seed.sql                                # 初期ダイブサイト（国内主要ポイント）を投入（既存があれば追記）

service-front/src/
├── app/(authenticated)/dive-sites/[id]/
│   └── page.tsx                            # ダイブサイト詳細（/dive-sites/[id]）— 実績表示
├── features/dive-sites/                    # 新規 feature（マスタ参照・実績）
│   ├── components/
│   │   └── server/
│   │       └── DiveSiteDetail/             # サイト詳細（本数・平均透明度・ベストシーズン）Server Component
│   ├── lib/
│   │   ├── siteStats.ts                    # 本人ログ → 本数 / 平均透明度 / 月別本数（純粋関数）
│   │   ├── siteStats.test.ts
│   │   ├── siteLabel.ts                    # name + area → 表示ラベル（例: 伊豆 / 大瀬崎）（純粋関数）
│   │   └── siteLabel.test.ts
│   ├── server/
│   │   └── queries.ts                      # listDiveSites / getDiveSiteById / 本人のサイト別ログ取得
│   ├── types.ts
│   └── index.ts
├── features/dives/                         # 既存 feature の改修
│   ├── schemas/dive.schema.ts              # diveSiteId（任意）追加 + サイト参照/自由入力の排他ルール
│   ├── components/client/DiveForm/         # サイト検索選択 + 自由入力フォールバックを追加
│   ├── components/server/DiveDetail/       # サイト名を /dive-sites/[id] へのリンクで表示
│   ├── components/client/DiveCard/         # 一覧カードの表示名をサイト名 or location に
│   └── server/{queries,actions}.ts         # dive_sites join で表示名解決 / create・update で diveSiteId を保存
└── shared/components/form/
    └── SearchSelect/                       # 検索付き単一選択コンボボックス（Client, WAI-ARIA）
```

**Structure Decision**: 「マスタ参照・実績」は新規 `features/dive-sites` に独立させ、ログ入力側（`features/dives`）とは **feature 間 import を避けて** ページ層で接続する（006 で `features/certifications` ↔ `features/dives` を取った方式を踏襲 — [research.md R5](research.md)）。検索選択 UI は再利用可能な汎用部品として `shared/components/form/SearchSelect` に置く。

## 設計詳細

### スコープ境界（重要）

本機能では **US1（検索選択 + 自由入力の同居）/ US2（サイト別実績ページ）** を実装する。**US3（管理画面でのマスタ追加・編集・統合）は本機能のスコープ外** とし、別機能「管理画面」+ 管理者ロール導入の前提に依存する（spec Assumptions / Dependencies 参照）。本機能ではマスタの初期データを `seed.sql` で投入し、書き込みは RLS で一般ユーザーから塞ぐ。FR-007 / FR-008 / FR-009（管理 UI・統合・削除制限）は「管理画面」機能で実装する（FR-009 の削除制限は `on delete restrict` で DB レベルの安全網のみ先行確保）。

### ダイブサイト選択と自由入力の同居（US1）

- ダイブログ作成/編集ページ（Server Component）で `features/dive-sites` の `listDiveSites()` を呼び、サイト選択肢（`{ id, label }`、label は `siteLabel.ts` で `area / name` を組み立て）を `DiveForm` に props 注入する（feature 間 import 回避）。
- `DiveForm`（Client）は **検索選択（SearchSelect）** と **自由入力テキスト** を提示する。サイトを選べば `diveSiteId` を、選ばず自由入力すれば `location` を送る（排他）。
- `dive.schema.ts` に `diveSiteId`（任意・null 可）を追加し、yup の `.test` で「`diveSiteId` か `location` のどちらか一方が必須・両方は不可」を検証する。Server Action でも同じ排他を再検証し、DB CHECK が最終防衛線。
- `createDive` / `updateDive` は `diveSiteId` 指定時は `location = null`、未指定時は従来どおり `location` を保存する。`user_id` は `auth.uid()` から設定（既存方針）。

### サイト表示名の解決（FR-003 / FR-013）

- 一覧（DiveCard / DiveList）・詳細（DiveDetail）の表示名は、`dive_site_id` があれば join した `dive_sites.name`（+ area）から、無ければ `location` から解決する。クエリは `dive:dives` 同様に `dive_site:dive_sites(id, name, area)` を select join する。
- 表示名の組み立ては純粋関数 `siteLabel.ts`（`name` / `area` → 「伊豆 / 大瀬崎」）に集約し、ログ側・サイト側で共有する。
- **ポイント名検索（FR-013）**: 既存のダイブログ検索（`DiveSearchBar` / `diveSearchSchema` / 検索クエリ）を改修し、キーワードを **サイト名（`dive_sites.name`）と自由入力名（`location`）の双方** に一致させる。サイト参照ログは `location` が null でもサイト名でヒットする。実装は **2 段階クエリ**: 名前が一致する `dive_sites` の ID を先に引き、`dives` を `location.ilike` OR `dive_site_id.in.(...)` で合流させる（PostgREST の結合列 OR 制約を回避。表示用の `dive_site` 結合 select は別途保持）。

### サイト別実績（US2 / `siteStats.ts`）

- 入力: 本人の当該サイトのログ配列（`{ diveDate: string, visibilityM: number | null }[]`）＋ 表示用の基準（順位上位 N の月）。RLS スコープの select（`where dive_site_id = X`、本人のログのみ）でデータ取得し、純粋関数で集計（新規 RPC は作らない — [research.md R3](research.md)）。
- 出力:
  - 本数: 配列件数
  - 平均透明度: `visibilityM != null` のみで平均（小数 1 桁）。該当 0 件は「—」
  - ベストシーズン: 月（1–12）ごとの本数を集計し、本数が多い月の **上位 3 ヶ月**（同数は月昇順）。対象ログが **3 本未満** なら傾向を出さず「傾向を出すにはログが不足」と表示
- 0 件サイトは本数 0・実績なし表示（破綻させない）。

### ダイブサイト詳細ページ（FR-006a）

- ルート `/dive-sites/[id]`（`(authenticated)` 配下）。`getDiveSiteById(id)` でマスタ情報、本人のサイト別ログで実績を取得し `DiveSiteDetail`（Server Component）で表示。`generatePageMetadata` で metadata（noIndex 付与）をエクスポート。
- `DiveDetail`（ログ詳細）のサイト名を当ページへのリンクにする。
- `proxy.ts` の `APP_ROUTE_PREFIXES` に `/dive-sites` を追加（未認証は `/login` へ）。

### マイグレーション / RLS

- `dive_sites`: `id`(uuid pk) / `name`(text not null, **unique**, length CHECK) / `area`(text null) / `country`(text not null default 'JP') / `description`(text null) / `created_at` / `updated_at`（`handle_updated_at` トリガ再利用）。RLS 有効化、**SELECT** は authenticated に許可、INSERT/UPDATE/DELETE ポリシーは設けない（seed / service role のみ）。
- `dives`: `dive_site_id uuid references public.dive_sites(id) on delete restrict`（null 可）追加。`location` を nullable 化。排他 CHECK `dives_site_or_location_check`（片方のみ必須）。FK インデックス `idx_dives_user_id_dive_site_id`。既存行は `location` 設定済み・`dive_site_id` null で CHECK を満たすため無変更で互換。

### エラーメッセージ方針

| ケース | メッセージ（案） |
|--------|----------------|
| サイトも自由入力も未指定 | ポイントを選択するか、ポイント名を入力してください |
| サイトと自由入力の両方指定 | ポイントは選択と手入力のどちらか一方にしてください |
| 選択したサイトが存在しない | 選択したダイブサイトが見つかりません。再度選択してください |

## Complexity Tracking

違反なしのため記載なし。
