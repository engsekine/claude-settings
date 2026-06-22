# Tasks: 統計の拡充（年別・月別本数推移 / 水温×季節 / 最大深度推移）

**Input**: Design documents from `/specs/010-stats-expansion/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/dive-trends-rpc.md, quickstart.md

**Tests**: Constitution III（Test-First）に従い、テストタスクを実装タスクの前に必須で含める。テストは先に書いて失敗を確認してから実装する。

**Organization**: ユーザーストーリー単位でフェーズを分け、各ストーリーを独立して実装・検証できるようにする。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（別ファイル・未完了タスクへの依存なし）
- **[Story]**: 対応するユーザーストーリー（US1 / US2 / US3）

## Phase 1: Setup（DB・型の基盤）

**Purpose**: 集計 RPC と型定義の追加。アプリ実装の前提

- [X] T001 [P] `get_dive_yearly_counts()` RPC のマイグレーションを作成する: `supabase/migrations/<timestamp>_create_get_dive_yearly_counts.sql`（data-model.md の SQL 定義どおり。`security invoker` + `set search_path = ''` + `(select auth.uid())`、`comment on function` 付与）
- [X] T002 [P] `get_dive_monthly_stats(months_back integer default 12)` RPC のマイグレーションを作成する: `supabase/migrations/<timestamp>_create_get_dive_monthly_stats.sql`（同上。`avg(water_temp_c)` の null 自動除外で FR-006 を担保）
- [X] T003 `packages/supabase/src/types.ts` の `Functions` に `get_dive_yearly_counts` / `get_dive_monthly_stats` の Args / Returns 型を追加する（既存 `get_dive_stats` と同形式）。`supabase db reset` でマイグレーション適用を確認する

**Checkpoint**: psql で 2 RPC が呼び出せる（未認証コンテキストで 0 行・エラーなし — quickstart.md §1）

---

## Phase 2: Foundational（全ストーリー共通の整形ロジックとカード部品）

**Purpose**: 3 ストーリーすべてが依存する 0 埋め純粋関数・クエリ関数・グラフカード枠

**⚠️ CRITICAL**: このフェーズ完了まで各ユーザーストーリーには着手しない

- [X] T004 `service-front/src/features/dashboard/types.ts` に `YearlyDiveCount` / `MonthlyDiveStat` インターフェースを追加する（data-model.md「アプリ層の導出モデル」どおり）
- [X] T005 [P] `fillYearlyGaps` / `fillMonthlyGaps` の Vitest テストを先に書く: `service-front/src/features/dashboard/lib/trends.test.ts`（歯抜け年 0 埋め / `fillYearlyGaps` の空配列は [] / 単一年 / 12 要素になる / **`fillMonthlyGaps` は rows が空でも 12 要素の 0 本・null 列を返す（research.md R-006）** / 年跨ぎ（基準 2026-06 → 2025-07 始まり）/ 欠測月の水温・深度 null — quickstart.md §2）。実装前に失敗することを確認する
- [X] T006 `fillYearlyGaps` / `fillMonthlyGaps` を純粋関数として実装する: `service-front/src/features/dashboard/lib/trends.ts`（contracts/dive-trends-rpc.md のシグネチャどおり）。T005 のテストを green にする
- [X] T007 `getYearlyDiveCounts` / `getMonthlyDiveStats` を追加する: `service-front/src/features/dashboard/server/queries.ts`（RPC 呼び出し → camelCase 変換 → `lib/trends.ts` で 0 埋め。基準月は `todayInJst()` から導出。エラーは既存 `getDiveStats` と同形式の `Error` を throw）
- [X] T008 [P] `TrendChartCard` のテストと story を先に書く: `service-front/src/features/dashboard/components/server/TrendChartCard/TrendChartCard.test.tsx` / `TrendChartCard.stories.tsx`（h3 見出し / children 描画 / `<details>` + `<summary>データを表で見る</summary>` + データテーブル / キーボード開閉）
- [X] T009 `TrendChartCard` を Server Component として実装する: `service-front/src/features/dashboard/components/server/TrendChartCard/TrendChartCard.tsx` + `index.ts`（見出し + チャート用 children + 代替データテーブルの `<details>`。Tailwind utility-first・Client 化しない）

**Checkpoint**: `npm run test -- src/features/dashboard/lib/trends.test.ts` と TrendChartCard のテストが green

---

## Phase 3: User Story 1 - 年別・月別の本数推移を確認する (Priority: P1) 🎯 MVP

**Goal**: TOP の「統計の推移」セクションに年別本数・月別本数（直近 12 ヶ月）の棒グラフを表示する

**Independent Test**: 複数年・複数月のログを持つユーザーで `/` を開き、年別・月別の本数グラフと 0 件時の空状態を確認できる（quickstart.md §4 シナリオ 1, 2, 5, 8）

### Tests for User Story 1（先に書いて失敗を確認）

- [X] T010 [P] [US1] `BarChart` のテストと story を書く: `service-front/src/shared/components/chart/BarChart/BarChart.test.tsx` / `BarChart.stories.tsx`（`role="img"` + `aria-label` / 値 0 の棒 / 単一項目で破綻しない / 多項目（10 年分以上）でラベル・棒が崩れない — spec Edge Case「長期間のログ」/ items 順序どおりの描画）
- [X] T011 [P] [US1] `DiveTrends` のテストと story を書く: `service-front/src/features/dashboard/components/server/DiveTrends/DiveTrends.test.tsx` / `DiveTrends.stories.tsx`（年別・月別カードの表示 / ログ 0 件の空状態 + 記録 CTA / エラー表示）

### Implementation for User Story 1

- [X] T012 [US1] `BarChart` を SVG の Server Component として実装する: `service-front/src/shared/components/chart/BarChart/BarChart.tsx` + `index.ts`（contracts の `BarChartProps`。イベントハンドラなし・静的描画）
- [X] T013 [US1] `DiveTrends` を実装する: `service-front/src/features/dashboard/components/server/DiveTrends/DiveTrends.tsx` + `index.ts`（`TrendChartCard` × 2: 年別本数 BarChart + 月別本数 BarChart。**空状態判定は年別集計が [] かどうか**で行い、ログはあるが直近 12 ヶ月 0 本の場合は 0 本列を表示 — research.md R-006。空状態は `/dives/new` CTA 付き、エラー時は `StatsCards` と同様に null 受け取りでメッセージ表示 — FR-001 / FR-002 / FR-007）
- [X] T014 [US1] `TopDashboard` に「統計の推移」セクションを追加する: `service-front/src/features/dashboard/components/server/TopDashboard/TopDashboard.tsx`（累計統計の直後に `aria-labelledby="dashboard-trends"` セクション。`getYearlyDiveCounts` / `getMonthlyDiveStats` を try/catch で呼び出し `DiveTrends` に渡す — 既存 stats と同じエラーハンドリング方針）
- [X] T015 [US1] `TopDashboard` のテストを作成する: `service-front/src/features/dashboard/components/server/TopDashboard/TopDashboard.test.tsx`（「統計の推移」セクションの存在 / 集計失敗時もページが落ちない。※ 既存 TopDashboard に test / story はなく、async Server Component のため story は対象外 — クエリをモックした test を新規作成）

**Checkpoint**: US1 単独で動作する MVP。quickstart.md §4 シナリオ 1（本数グラフ）・2（0 本月）・5（ログ 0 件）・8（未認証リダイレクト）が通る

---

## Phase 4: User Story 2 - 最大深度の推移を確認する (Priority: P2)

**Goal**: 「統計の推移」セクションに月別最大深度の折れ線グラフを追加する

**Independent Test**: 深度の異なるログを複数登録し、深度推移グラフが表示される（quickstart.md §4 シナリオ 6 含む）。US1 のグラフとは独立に確認可能

### Tests for User Story 2（先に書いて失敗を確認）

- [X] T016 [P] [US2] `LineChart` のテストと story を書く: `service-front/src/shared/components/chart/LineChart/LineChart.test.tsx` / `LineChart.stories.tsx`（`role="img"` + `aria-label` / **value null で線が分断される** / 単一点で破綻しない / unit 表示）

### Implementation for User Story 2

- [X] T017 [US2] `LineChart` を SVG の Server Component として実装する: `service-front/src/shared/components/chart/LineChart/LineChart.tsx` + `index.ts`（contracts の `LineChartProps`。null = 欠測の分断描画で 0 と区別 — FR-006 の前提部品）
- [X] T018 [US2] `DiveTrends` に最大深度カードを追加する: `service-front/src/features/dashboard/components/server/DiveTrends/DiveTrends.tsx`（`MonthlyDiveStat.maxDepthM` を LineChart で表示、ダイブなし月は欠測 — FR-004）。`DiveTrends.test.tsx` / `DiveTrends.stories.tsx` を同期更新する

**Checkpoint**: US1 + US2 がともに動作。深度推移が単一点でも崩れない（Edge Case）

---

## Phase 5: User Story 3 - 水温と季節の傾向を確認する (Priority: P3)

**Goal**: 「統計の推移」セクションに月別平均水温の折れ線グラフを追加する

**Independent Test**: 水温入りログを複数月分登録し、水温傾向グラフと未入力時の空状態を確認できる（quickstart.md §4 シナリオ 3, 4）

**Note**: `LineChart`（T016–T017）に依存する。US2 を後回しにする場合は T016–T017 を先に実施すること

### Implementation for User Story 3

- [X] T019 [US3] `DiveTrends` に水温カードを追加する: `service-front/src/features/dashboard/components/server/DiveTrends/DiveTrends.tsx`（`MonthlyDiveStat.avgWaterTempC` を LineChart（unit '℃'）で表示。**全期間で水温データ 0 件の場合はカード内に「水温を記録すると傾向が表示される」空状態** — FR-005 / FR-006 / US3-AC3）。`DiveTrends.test.tsx` / `DiveTrends.stories.tsx` に水温カード・水温空状態のケースを追加する

**Checkpoint**: 全ストーリーが動作。水温未入力混在月の平均が入力済みログのみで計算される（quickstart.md §4 シナリオ 4）

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T020 [P] TOP（ダッシュボード）の Playwright + axe-core a11y テストを追加・更新する: `service-front/tests/a11y/`（「統計の推移」セクション・`<details>` 開閉後に violation がないこと — FR-009）
- [X] T021 [P] lint / typecheck / 全 Vitest を実行して green を確認する（`service-front` で `npm run lint && npm run test`）
- [ ] T022 quickstart.md §4 の全シナリオ + §5 パフォーマンス確認（数百件投入で 2 秒以内 — SC-002）を実施する
  - 実施済み: §1（RPC 未認証 0 行）/ §2（単体テスト）/ §4 シナリオ 4・9・10 相当を DB レベルで検証（RLS 分離・水温 null 除外・古いログのみの集計）
  - 残り（要 dev サーバー + テストユーザー）: §3 Storybook 目視・Playwright 実行、§4 ブラウザ操作シナリオ、§5 パフォーマンス計測。※ 本ブランチに `supabase/seed.sql` がなく、a11y テスト前提ユーザー（test@example.com）の投入が必要
- [X] T023 `/sync-spec specs/010-stats-expansion` で実装と仕様書（spec.md / data-model.md / contracts）のずれを確認し、ずれがあれば仕様書側を実装に合わせて更新する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1（Setup）**: 依存なし。T001 / T002 は並列可、T003 は両方の後
- **Phase 2（Foundational）**: Phase 1 完了後。**全ユーザーストーリーをブロックする**
- **Phase 3–5（US1–US3）**: Phase 2 完了後。US1 → US2 → US3 の優先順を推奨
- **Phase 6（Polish)**: 実施対象のストーリー完了後

### User Story Dependencies

- **US1 (P1)**: Phase 2 のみに依存。単独で MVP
- **US2 (P2)**: Phase 2 のみに依存（DiveTrends への追記は US1 実装後が自然だが、カード単位で独立検証可能）
- **US3 (P3)**: `LineChart`（T016–T017）に依存。US2 完了後が自然。それ以外は独立

### Within Each Story

- テスト（先に書いて失敗確認）→ 実装 → 既存コンポーネントへの統合 → テスト・story 同期
- 共有チャート部品（BarChart / LineChart）→ DiveTrends → TopDashboard の順

### Parallel Opportunities

- T001 / T002（マイグレーション 2 ファイル）
- T005（trends テスト）と T008（TrendChartCard テスト・story）
- T010（BarChart テスト）と T011（DiveTrends テスト）
- T020 / T021（Polish の独立タスク）

---

## Parallel Example: User Story 1

```bash
# テストを並列で先行作成（失敗を確認）:
Task: "BarChart のテストと story を service-front/src/shared/components/chart/BarChart/ に作成"
Task: "DiveTrends のテストと story を service-front/src/features/dashboard/components/server/DiveTrends/ に作成"

# その後、依存順に実装:
T012 BarChart → T013 DiveTrends → T014 TopDashboard 統合 → T015 テスト同期
```

---

## Implementation Strategy

### MVP First（US1 のみ）

1. Phase 1（RPC + 型）→ Phase 2（整形関数 + カード枠）を完了する
2. Phase 3（US1: 本数推移 2 グラフ）を完了する
3. **STOP & VALIDATE**: quickstart.md §4 シナリオ 1, 2, 5, 8 で独立検証する
4. この時点でデプロイ可能な MVP（「統計の推移」セクションが本数 2 グラフで成立）

### Incremental Delivery

1. MVP（US1）→ 検証 → デプロイ
2. US2（深度 LineChart）追加 → 検証 → デプロイ
3. US3（水温）追加 → 検証 → デプロイ
4. Polish（a11y E2E / パフォーマンス / 仕様書同期）

---

## Notes

- 各タスク完了ごと（または論理的なまとまりごと）に Conventional Commits でコミットする（`feat:` / `test:` / `chore:`）
- コンポーネントは必ず専用フォルダ + test + story + index.ts の 4 点セット（`.claude/CLAUDE.md` のフォルダ構成規約）
- 既存 `get_dive_stats()` / `StatsCards` には手を入れない（research.md R-001）
