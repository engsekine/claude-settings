---

description: "Task list for tide phase display implementation"
---

# Tasks: 潮回り表示（ダイビング記録・予定）

**Input**: Design documents from `/specs/007-tide-phase-display/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Constitution III（Test-First）に従い、算出ロジックはテストを先に書く。表示を統合する既存コンポーネントは同階層の test / story を同期更新する（テスト同期ルール）。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)

## 前提

- 既存のダイビング記録機能（002）・ダイビング予定機能（004）が動作すること
- **マイグレーション・依存パッケージ追加・新規画面は本機能では一切不要**（Setup フェーズなし）

---

## Phase 1: Foundational (共通算出ロジック)

**Purpose**: 両ユーザーストーリーが依存する潮回り算出の純粋関数（[data-model.md](data-model.md) / [research.md R1-R3](research.md) 参照）

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 `service-front/src/shared/lib/tide.test.ts` を作成（[data-model.md 4 節](data-model.md) の基準日付 8 件 → 期待潮名（下弦と、基準朔以前の日付による負値補正パスを含む）、不正入力・形式不正 → null、連続 30 日で 5 区分すべてが出現し「小潮 → 長潮 → 若潮 → 中潮」の順で循環すること、同一入力 → 同一出力の決定性。テストを先に書き、この時点では fail する）
- [X] T002 `service-front/src/shared/lib/tide.ts` を実装（`TidePhase` ユニオン型・`TIDE_PHASE_LABELS` 定数・`getTidePhase(date: string): TidePhase | null`。基準朔 2000-01-06T18:14Z + 平均朔望月 29.530588853 日の剰余、JST 正午評価、`floor(月齢) + 1` → 旧暦日対応表。T001 をグリーンにする）

**Checkpoint**: 算出ロジック確立 - user story implementation can now begin in parallel

---

## Phase 2: User Story 1 - ダイビング記録での潮回り表示 (Priority: P1) 🎯 MVP

**Goal**: 記録一覧のカードと記録詳細に、各記録の日付に対応する潮回りラベルが表示される。

**Independent Test**: 日付 `2000-01-07` のログで「大潮」、`2000-01-13` のログで「小潮」が一覧・詳細に表示されること（[quickstart.md シナリオ 1](quickstart.md)）。

### Implementation for User Story 1

- [X] T003 [P] [US1] `service-front/src/features/dives/components/client/DiveCard/DiveCard.tsx` に潮回りラベルを統合（`getTidePhase(dive.diveDate)` → `TIDE_PHASE_LABELS` のテキスト表示。null 時はラベル要素ごと非描画）し、同階層の `DiveCard.test.tsx` / `DiveCard.stories.tsx` を同期更新（基準日付での期待ラベルのアサートを追加）
- [X] T004 [P] [US1] `service-front/src/features/dives/components/server/DiveDetail/DiveDetail.tsx` に潮回り表示を統合し、同階層の `DiveDetail.test.tsx` / `DiveDetail.stories.tsx` を新規作成（既存コンポーネントに test / story が未整備だったため、Constitution III に従い統合と同時に整備）

**Checkpoint**: 記録一覧・詳細で潮回りが見え、US1 単独でリリース可能

---

## Phase 3: User Story 2 - ダイビング予定での潮回り表示 (Priority: P2)

**Goal**: 予定一覧・予定詳細・TOP の「次の予定」カードに、予定日に対応する潮回りが表示される。保存・更新で再計算される。

**Independent Test**: 新月にあたる未来日付の予定を保存し、一覧・詳細・TOP カードに「大潮」が表示されること（[quickstart.md シナリオ 2](quickstart.md)）。

### Implementation for User Story 2

- [X] T005 [P] [US2] `service-front/src/features/plans/components/client/PlanList/PlanList.tsx` に潮回りラベルを統合（`getTidePhase(plan.plannedOn)`）し、同階層の `PlanList.test.tsx` / `PlanList.stories.tsx` を同期更新
- [X] T006 [P] [US2] `service-front/src/features/plans/components/server/NextPlanCard/NextPlanCardView.tsx`（TOP「次の予定」カード）に潮回りラベルを統合し、同階層の test / story を同期更新
- [X] T007 [P] [US2] `service-front/src/app/(authenticated)/plans/[id]/page.tsx`（予定詳細）に潮回り表示を追加（予定日の近くにテキストラベル）

**Checkpoint**: 全ユーザーストーリーが独立して動作する

---

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T008 [P] a11y spec を整備して `make front-test-a11y` で全対象画面の axe-core 違反 0 件を確認: `service-front/tests/a11y/dives-pages.spec.ts`（記録一覧 `/dives`・記録詳細 `/dives/[id]`）と `service-front/tests/a11y/top-page.spec.ts`（TOP ダッシュボード）を新規作成する（既存のログインパターンを踏襲。予定詳細 `/plans/[id]` は既存 `plans-pages.spec.ts` が予定作成フローで検証済みのため追記不要）。潮回りラベルがテキストとして読み上げ対象であること（FR-008）
- [X] T009 [quickstart.md](quickstart.md) の手動検証シナリオ 1〜3 を実施（一時 Playwright スクリプトで実アプリに対して自動実行: 記録 2000-01-07 → 一覧・詳細に「大潮」、予定 2026-06-15 → 一覧・詳細・TOP に表示、編集 2026-06-20 → 「中潮」へ再計算を確認）
- [X] T010 `make front-validate` で型チェック・lint・テストの全チェックをグリーンにする
- [X] T011 TOP「最近のダイビング」リストへの潮回り表示（追加要望 2026-06-13）: `service-front/src/features/dashboard/components/server/RecentDives/RecentDives.tsx` に潮回りラベルを統合し、同階層の test / story を同期更新。TOP の a11y 再確認（FR-001）

---

## Dependencies

```text
Phase 1 (T001 → T002)  ※ テスト先行のため直列
   ↓
Phase 2: US1 (T003 / T004 並列)  ─┬─ US1 と US2 は触るファイルが完全に分離しており互いに独立。
Phase 3: US2 (T005 / T006 / T007 並列) ─┘  Phase 1 完了後に並行着手可
   ↓
Phase 4: Polish (T008-T011)  ※ T011 は実装後の追加要望（2026-06-13）
```

- US1（dives 配下）と US2（plans 配下 + 予定詳細ページ）は変更ファイルが重ならないため、Phase 1 完了後に完全並行で進められる
- 各ストーリー内のタスクもすべて別ファイルのため並列可

## Parallel Execution Examples

```text
Phase 1:  T001 tide.test.ts → T002 tide.ts（直列。fail を確認してから実装）

Phase 1 完了後:
          US1: T003 DiveCard ──┬─ すべて並列（5 ファイルが独立）
               T004 DiveDetail ─┤
          US2: T005 PlanList ───┤
               T006 NextPlanCardView ─┤
               T007 plans/[id]/page ──┘

Phase 4:  T008 a11y ─┬─ 並列
          T009 手動検証 ─┘ → T010 front-validate（最後）
```

## Implementation Strategy

1. **MVP first**: Phase 1〜2（T001〜T004）で「記録での潮回り表示」をリリース可能な状態にする
2. **Incremental delivery**: US2（予定での表示）を独立した増分として追加。各 Checkpoint で動作確認してから次へ進む
3. **Test-First**: T001 は T002 より必ず先に着手し、fail を確認してから実装する。T003〜T007 は統合と同時に同階層の test / story を必ず同期更新する
4. コミット前に `/review` と `/sync-spec` を実施する（Constitution: Development Workflow）
