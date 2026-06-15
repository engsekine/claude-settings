# Implementation Plan: 統計の拡充（年別・月別本数推移 / 水温×季節 / 最大深度推移）

**Branch**: `010-stats-expansion` | **Date**: 2026-06-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/010-stats-expansion/spec.md`

## Summary

既存ダッシュボード（TOP）の累計統計の下に「統計の推移」セクションを追加し、(1) 年別本数、(2) 月別本数推移（直近 12 ヶ月）、(3) 月別平均水温、(4) 月別最大深度を表示する。集計は既存 `get_dive_stats()` と同じ方針で **DB 側集計の RPC を新設**して行い（`get_dive_yearly_counts()` / `get_dive_monthly_stats()`）、歯抜け月・年の 0 埋めは TypeScript の純粋関数で行う。グラフは外部チャートライブラリを追加せず、**Server Component の軽量 SVG チャート**（共有コンポーネント `BarChart` / `LineChart`）として自作し、`<details>` + テーブルによる代替表現で a11y（FR-009）を満たす。

## Technical Context

**Language/Version**: TypeScript（strict mode）/ Next.js App Router（React Server Components + React Compiler）

**Primary Dependencies**: Next.js / React / Tailwind CSS / Supabase JS（`@repo/supabase`）。**チャートライブラリは追加しない**（research.md 参照）

**Storage**: Supabase（PostgreSQL）。新規テーブルなし。新規 RPC 2 つ（`get_dive_yearly_counts()` / `get_dive_monthly_stats(months_back)`）。既存 `dives` を参照（`dive_date` / `water_temp_c` / `max_depth_m`）

**Testing**: Vitest + React Testing Library（単体・コンポーネント）、Storybook、Playwright（axe-core a11y）

**Target Platform**: Web（モバイル / タブレット / PC、モバイルファースト）

**Project Type**: Web application（`service-front` モノレポ内 Next.js アプリ + `supabase/` マイグレーション）

**Performance Goals**: SC-002（数百本のログで 2 秒以内）。集計は DB 側 RPC で行い、転送行数は年別 = 記録年数・月別 = 12 行に抑える。グラフは SVG の静的描画でクライアント JS を追加しない

**Constraints**: RLS（security invoker）で本人データのみ集計。WCAG 2.1 AA（グラフの代替テキスト表現必須）。水温未入力は集計から除外し 0℃ と混同しない（FR-006）

**Scale/Scope**: 画面変更 1 つ（TOP の拡張）、新規 RPC 2 つ、新規コンポーネント 4 つ（共有チャート 2 + dashboard 2）、新規純粋関数モジュール 1 つ

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

`.specify/memory/constitution.md` v1.0.0 基準。

| 原則 | 判定 | 備考 |
|---|---|---|
| I. Spec-Driven Development | ✅ | spec.md → 本 plan → tasks.md の順で進行 |
| II. Server Components First | ✅ | グラフ含め全コンポーネントを Server Component で実装。Client 化なし（インタラクションは native `<details>` で代替） |
| III. Test-First | ✅ | 集計整形（`lib/trends.ts`）は純粋関数として Vitest 先行。コンポーネントは test + story + a11y テスト同梱 |
| IV. Security & RLS by Default | ✅ | RPC は `security invoker` + `set search_path = ''`。RLS により本人の行のみ集計（FR-008）。スキーマ変更はマイグレーション経由のみ |
| V. Accessibility | ✅ | SVG チャートに `role="img"` + `aria-label`、`<details>` 内のデータテーブルで代替表現（FR-009）。色のみに依存しない |
| VI. Coding Standards | ✅ | SQL は snake_case / `set search_path = ''`、コンポーネントは専用フォルダ構成、`any` 禁止 |

**違反なし。** Complexity Tracking 不要。

## Project Structure

### Documentation (this feature)

```text
specs/010-stats-expansion/
├── spec.md              # 機能仕様
├── plan.md              # This file
├── research.md          # Phase 0: 技術選定の調査・決定
├── data-model.md        # Phase 1: RPC 定義（新規テーブルなし）
├── quickstart.md        # Phase 1: 動作検証ガイド
├── contracts/
│   └── dive-trends-rpc.md  # RPC 入出力契約
└── tasks.md             # /speckit-tasks の出力（本コマンドでは作らない）
```

### Source Code (repository root)

```text
service-front/src/shared/components/chart/        # 新規: 汎用 SVG チャート（Server Component）
├── BarChart/
│   ├── BarChart.tsx                              # 棒グラフ（本数推移用）
│   ├── BarChart.test.tsx
│   ├── BarChart.stories.tsx
│   └── index.ts
└── LineChart/
    ├── LineChart.tsx                             # 折れ線グラフ（水温・深度用、欠測対応）
    ├── LineChart.test.tsx
    ├── LineChart.stories.tsx
    └── index.ts

service-front/src/features/dashboard/
├── components/server/
│   ├── DiveTrends/                               # 新規: 「統計の推移」セクション本体
│   │   ├── DiveTrends.tsx                        # 4 グラフの組み立て + 空状態
│   │   ├── DiveTrends.test.tsx
│   │   ├── DiveTrends.stories.tsx
│   │   └── index.ts
│   ├── TrendChartCard/                           # 新規: グラフ 1 枚のカード（見出し + チャート + 代替テーブル <details>）
│   │   ├── TrendChartCard.tsx
│   │   ├── TrendChartCard.test.tsx
│   │   ├── TrendChartCard.stories.tsx
│   │   └── index.ts
│   └── TopDashboard/
│       └── TopDashboard.tsx                      # 変更: 「統計の推移」セクションを追加
├── server/
│   └── queries.ts                                # 変更: getYearlyDiveCounts / getMonthlyDiveStats を追加
├── lib/
│   ├── trends.ts                                 # 新規: 歯抜け 0 埋め・直近 12 ヶ月キー生成（純粋関数）
│   └── trends.test.ts
└── types.ts                                      # 変更: YearlyDiveCount / MonthlyDiveStat を追加

packages/supabase/src/types.ts                    # 変更: 新規 RPC 2 つの Functions 型を追加

supabase/migrations/
├── <ts>_create_get_dive_yearly_counts.sql        # 新規 RPC: 年別本数
└── <ts>_create_get_dive_monthly_stats.sql        # 新規 RPC: 月別本数 / 平均水温 / 最大深度
```

**Structure Decision**: 既存の Feature-based アーキテクチャに従い、表示は既存 `dashboard` feature の拡張として実装する（新規 feature は作らない。統計の元データ・表示場所とも dashboard の責務範囲のため）。SVG チャート 2 種はドメイン非依存の表示部品として `src/shared/components/chart/` に置き、dashboard 側はデータ整形とカード組み立てに専念する。既存 `get_dive_stats()` RPC は**変更しない**（単一行の累計値と複数行の時系列は戻り値の形が異なるため、別 RPC として追加する — research.md 参照）。

## 設計詳細

### データフロー

```text
dives（RLS: 本人行のみ）
  → RPC get_dive_yearly_counts()            … 年別 (year, dive_count)。記録のある年のみ返す
  → RPC get_dive_monthly_stats(months_back) … 月別 (month, dive_count, avg_water_temp_c, max_depth_m)。記録のある月のみ返す
  → queries.ts（snake_case → camelCase 変換のみ）
  → lib/trends.ts（純粋関数）
      - fillYearlyGaps:  最古年〜最新年の歯抜け年を 0 本で補完（FR-003）
      - fillMonthlyGaps: 基準日から直近 12 ヶ月のキー列を生成し、データのない月を
        dive_count = 0 / 水温・深度 = null（欠測）で補完（FR-003 / FR-006）。
        rows が空でも常に 12 要素を返す（research.md R-006）
  → DiveTrends（セクション）→ TrendChartCard × 4 → BarChart / LineChart（SVG 描画）
```

- 0 埋めを TS 側の純粋関数で行う理由: Vitest で網羅的にテストでき（Test-First）、SQL の `generate_series` 結合より RPC を単純に保てる
- 月別の基準日は `todayInJst()`（`@/shared/lib/date`）。`dive_date` は date 型のためタイムゾーン変換は不要（spec Assumptions）

### グラフと a11y（FR-009）

- `BarChart` / `LineChart` は props でデータ列を受け取り `<svg role="img" aria-label="...">` を静的に描画する Server Component。アニメーション・ツールチップは持たない
- `LineChart` は `null`（欠測）を線の分断として描画し、0 と区別する（FR-006 / Edge Case「0℃ と誤表示しない」）
- 各 `TrendChartCard` は見出し（`h3`）+ チャート + `<details><summary>データを表で見る</summary><table>…</table></details>` を持ち、スクリーンリーダー・グラフが読めない環境への代替表現とする（native 要素のみで Client 化不要）
- データ点が 1 件のみでも描画が破綻しないこと（Edge Case）を BarChart / LineChart の単体テストで担保する

### TopDashboard への組み込み

「累計統計」セクションの直後に「統計の推移」セクション（`aria-labelledby="dashboard-trends"`）を追加する。

- ログ 0 件: セクション内に「ログを記録すると統計が表示される」空状態 + 記録 CTA（FR-007）。**判定は年別集計（全期間対象）が空配列かどうかで行う**
- ログはあるが直近 12 ヶ月が 0 本（古いログのみのユーザー）: 空状態にせず、月別グラフを 12 要素の 0 本列として表示する（FR-003 / research.md R-006）
- 水温データ 0 件（ログはある）: 水温カードのみ「水温を記録すると傾向が表示される」空状態（US3-AC3）
- 集計クエリ失敗: 既存 `getDiveStats` と同様に try/catch し、セクション内エラー表示に委ねる（既存のエラーハンドリング方針を踏襲）

### エラーハンドリング

| 失敗箇所 | 挙動 |
|---|---|
| RPC 呼び出しエラー | `queries.ts` で `Error` を throw → `TopDashboard` で catch → `DiveTrends` にエラー表示（既存 stats と同じパターン） |
| データ 0 件 | エラーではなく空配列 → `DiveTrends` が空状態を表示 |

## Phase 0: Research

→ [research.md](./research.md)。未確定事項（NEEDS CLARIFICATION）はなし。技術選定 4 点（RPC 分割方針 / チャート実装方式 / 0 埋めの実装層 / 代替表現の方式）に加え、`/speckit-analyze` の指摘を受けた挙動確定 1 点（R-006: 直近 12 ヶ月にログがないユーザーの月別表示）の決定と根拠を記録した。

## Phase 1: Design & Contracts

- データモデル: [data-model.md](./data-model.md) — 新規テーブルなし、RPC 2 つの定義
- 契約: [contracts/dive-trends-rpc.md](./contracts/dive-trends-rpc.md) — RPC 入出力と TS 型のマッピング
- 検証ガイド: [quickstart.md](./quickstart.md)

## Constitution Re-Check（Post-Design）

Phase 1 設計後も違反なし。Server Component のみで完結（II）、純粋関数 + テスト同梱（III）、`security invoker` RPC + RLS（IV）、`<details>` テーブルによる代替表現（V）を設計に織り込み済み。
