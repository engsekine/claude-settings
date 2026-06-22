---

description: "Task list for SAC rate display implementation"
---

# Tasks: エア消費率（SAC）の自動計算・表示

**Input**: Design documents from `/specs/008-sac-rate-display/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Constitution III（Test-First）に従い、算出ロジックはテストを先に書く。表示を統合する DiveDetail は同階層の test / story を同期更新する（007 で整備済み）。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)

## 前提

- 既存のダイビング記録機能（002）が開始残圧・終了残圧・タンク容量・平均水深・潜水時間を持つこと
- **マイグレーション・依存パッケージ追加・新規画面・新規コンポーネントは本機能では一切不要**（Setup フェーズなし）

---

## Phase 1: Foundational (算出ロジック)

**Purpose**: 両ユーザーストーリーが依存する SAC 算出の純粋関数（[data-model.md](data-model.md) / [research.md R1-R3](research.md) 参照）

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 `service-front/src/features/dives/lib/sacRate.test.ts` を作成（[data-model.md 3 節](data-model.md) のフィクスチャ 8 件 → ok 15.0 / 12.0 / 20.0、表示丸め 15.2、missing の不足項目列挙（単一・複数）、invalid（消費量 0・負）、`formatSacRate` の「15.0 L/分」形式、同一入力 → 同一出力の決定性。テストを先に書き、この時点では fail する）
- [X] T002 `service-front/src/features/dives/lib/sacRate.ts` を実装（`SacRateResult` 判別共用体・`SacInputField` 型・`SAC_INPUT_FIELD_LABELS` 定数・`calcSacRate`・`formatSacRate`。計算式: 消費ガス量 = 残圧差 × タンク容量、周囲圧 = 平均水深 ÷ 10 + 1、SAC = 消費ガス量 ÷ 潜水時間 ÷ 周囲圧。T001 をグリーンにする）

**Checkpoint**: 算出ロジック確立 - user story implementation can now begin

---

## Phase 2: User Story 1 - 記録詳細でのエア消費率の自動表示 (Priority: P1) 🎯 MVP

**Goal**: 必要 5 項目が入力済みの記録の詳細（タンク・装備セクション）に「エア消費率 ○.○ L/分」が自動表示される。

**Independent Test**: 開始 200 bar・終了 50 bar・タンク 10 L・平均水深 10 m・50 分の記録の詳細に「15.0 L/分」が表示されること（[quickstart.md シナリオ 1](quickstart.md)）。

### Implementation for User Story 1

- [X] T003 [US1] `service-front/src/features/dives/components/server/DiveDetail/DiveDetail.tsx` のタンク・装備セクション末尾（装備メモの前）に `calcSacRate(dive)` が `ok` のとき「エア消費率」+ `formatSacRate` の値を表示する統合を行い、同階層の `DiveDetail.test.tsx`（SC-002 の代表値 15.0 L/分 のアサート）/ `DiveDetail.stories.tsx`（5 項目入りの story）を同期更新

**Checkpoint**: 5 項目が揃った記録でエア消費率が見え、US1 単独でリリース可能

---

## Phase 3: User Story 2 - 計算に必要な項目が足りないときの案内 (Priority: P2)

**Goal**: 必要項目が欠けた記録の詳細に、どの項目を入力すれば表示されるかの案内が出る。消費量が 0 以下になる不正な入力では何も表示しない。

**Independent Test**: 平均水深のみ未入力の記録の詳細で「平均水深を入力するとエア消費率が表示されます」が表示されること（[quickstart.md シナリオ 2](quickstart.md)）。

### Implementation for User Story 2

- [X] T004 [US2] `service-front/src/features/dives/components/server/DiveDetail/DiveDetail.tsx` に `missing` のとき `SAC_INPUT_FIELD_LABELS` で日本語化した不足項目の案内テキスト（`text-muted-foreground`）、`invalid` のとき何も描画しない分岐を統合し、同階層の test（単一不足・複数不足・invalid 非表示のアサート）/ story（不足案内の story）を同期更新

**Checkpoint**: 全ユーザーストーリーが独立して動作する

---

## Phase 4: Polish & Cross-Cutting Concerns

- [X] T005 [P] `make front-test-a11y` で記録詳細を含む既存画面の axe-core 違反 0 件を確認（`service-front/tests/a11y/dives-pages.spec.ts` は 007 で整備済み。新規 spec 不要。FR-008）
- [X] T006 [quickstart.md](quickstart.md) の手動検証シナリオ 1〜3 を実施（一時 Playwright スクリプトで実アプリに対して自動実行: 15.0 L/分 表示 → 終了残圧変更で 10.0 L/分 に再計算 → 平均水深を空にして不足案内 → 残圧同値で非表示を確認）
- [X] T007 `make front-validate` で型チェック・lint・テストの全チェックをグリーンにする

---

## Dependencies

```text
Phase 1 (T001 → T002)  ※ テスト先行のため直列
   ↓
Phase 2: US1 (T003)
   ↓（T003 / T004 は同一ファイル DiveDetail.tsx を触るため直列）
Phase 3: US2 (T004)
   ↓
Phase 4: Polish (T005 / T006 並列 → T007)
```

- US1 と US2 は同じ表示箇所（DiveDetail のタンク・装備セクション）に積み上げるため、本機能では例外的に直列とする（判別共用体の分岐追加で安全に拡張できる）
- 算出ロジック（Phase 1）と表示（Phase 2-3）はファイルが分かれており、T002 完了時点でロジック単体はテスト済み

## Parallel Execution Examples

```text
Phase 1:  T001 sacRate.test.ts → T002 sacRate.ts（直列。fail を確認してから実装）

Phase 2-3: T003 → T004（同一ファイルのため直列）

Phase 4:  T005 a11y ─┬─ 並列
          T006 手動検証 ─┘ → T007 front-validate（最後）
```

## Implementation Strategy

1. **MVP first**: Phase 1〜2（T001〜T003）で「5 項目が揃った記録への SAC 表示」をリリース可能な状態にする
2. **Incremental delivery**: US2（不足案内）を独立した増分として追加。各 Checkpoint で動作確認してから次へ進む
3. **Test-First**: T001 は T002 より必ず先に着手し、fail を確認してから実装する。T003 / T004 は統合と同時に同階層の test / story を必ず同期更新する
4. コミット前に `/review` と `/sync-spec` を実施する（Constitution: Development Workflow）
