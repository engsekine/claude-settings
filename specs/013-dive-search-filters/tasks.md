# Tasks: ダイブログ検索・フィルタ強化

**Input**: Design documents from `/specs/013-dive-search-filters/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/search-params.md, quickstart.md

**Tests**: Constitution III（Test-First）に従い、テストタスクを実装タスクの**前**に必須で含める。先に書いて失敗を確認してから実装する。

**Organization**: ユーザーストーリー単位でフェーズを分け、各ストーリーを独立して実装・検証できるようにする。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（別ファイル・依存なし）
- **[Story]**: 対応するユーザーストーリー（US1 / US2 / US3）
- すべてのパスは `service-front/` 基準（モノレポ）

## Path Conventions

- Web app（モノレポ）: アプリは `service-front/src/`。本機能は DB 変更なし

---

## Phase 1: Setup

**Purpose**: 作業前提の確認（新規依存・DB 変更なし）

- [X] T001 `013-dive-search-filters` ブランチで作業していること、新規依存が不要であることを `service-front/package.json` で確認する（react-hook-form / yup / @tanstack/react-query / next は既存）

---

## Phase 2: Foundational（全ストーリー共通の基盤）

**Purpose**: 型拡張・URL 同期・disclosure パネル基盤。3 ストーリーすべての前提

**⚠️ CRITICAL**: このフェーズ完了まで各ユーザーストーリーには着手しない

- [X] T002 `service-front/src/features/dives/types.ts` の `DiveListFilter` に `dateFrom?` / `dateTo?` / `depthMin?` / `depthMax?` / `diveType?` を追加し、単一 `diveDate?` を削除する（data-model.md）
- [X] T003 [P] `search-params` の Vitest を先に書く: `service-front/src/features/dives/lib/search-params.test.ts`（`parseDiveFilter`: 各パラメータの正常値・不正値/範囲外は無視・未知パラメータ無視 / `filterToSearchParams`: 空値は省略 / `isSameFilter`: 等価・差異 / round-trip 一致 — contracts/search-params.md）。実装前に失敗を確認
- [X] T004 `search-params` を実装する: `service-front/src/features/dives/lib/search-params.ts`（`parseDiveFilter` / `filterToSearchParams` / `isSameFilter` の純粋関数。`'use client'` / `server-only` を付けない）。T003 を green に
- [X] T005 `service-front/src/features/dives/hooks/useDives.ts` の `isEmptyFilter` を全フィルタ対応に一般化する（全 key 未指定で true）。`useDives` のテストがあれば同期更新
- [X] T006 `service-front/src/app/(authenticated)/dives/page.tsx` を `searchParams` 受け取りに変更し、`parseDiveFilter` → `listDives({ filter })` で SSR フェッチ、`DiveList` に `initialPage` と `initialFilter` を渡す（憲法 II / FR-010）
- [X] T007 `service-front/src/features/dives/components/client/DiveList/DiveList.tsx` を URL 同期に対応する: `initialFilter` で `useState` 初期化、検索/クリア時に `filterToSearchParams` で `router.replace`（scroll 維持）、`useDives` の initialData シードを `isSameFilter(filter, initialFilter)` で判定。0 件時にフィルタ解除導線を追加（FR-008 / SC-005）。`DiveList.test.tsx` を同期更新
- [X] T008 `service-front/src/features/dives/components/client/DiveSearchBar/DiveSearchBar.tsx` に折りたたみ「詳細条件」disclosure（`aria-expanded` / `aria-controls`）コンテナと「詳細条件: N 件適用中」表示を追加する。番号・ポイント名は常時表示を維持。`DiveSearchBar.test.tsx` / `DiveSearchBar.stories.tsx` を同期更新（FR-012 / 憲法 V）

**Checkpoint**: 空フィルタで全件表示、URL 復元、詳細パネル開閉が動作。`npm test -- src/features/dives/lib/search-params.test.ts` が green

---

## Phase 3: User Story 1 - 期間（日付範囲）で絞り込む (Priority: P1) 🎯 MVP

**Goal**: 開始日・終了日でダイブログを期間絞り込みでき、不正範囲はエラー、URL で復元できる

**Independent Test**: 異なる日付のログがある状態で開始日・終了日を指定 → 範囲内（両端含む）のみ表示。開始>終了でエラー（quickstart シナリオ 1〜3 / 10）

- [X] T009 [P] [US1] `service-front/src/features/dives/schemas/dive.schema.test.ts` に期間分のケースを追加する（`dateFrom`/`dateTo` の日付形式・`dateTo >= dateFrom`・片側のみ許容・不正でエラー — FR-001 / FR-006）。実装前に失敗を確認
- [X] T010 [US1] `service-front/src/features/dives/schemas/dive.schema.ts` の `diveSearchSchema` に `dateFrom` / `dateTo`（日付形式 + 相互制約 `.test`）を追加し、単一 `diveDate` を置換する。T009 を green に
- [X] T011 [P] [US1] `service-front/src/features/dives/lib/list-query.test.ts` に期間ケースを追加する（既存テスト手法に倣う。`dateFrom` → `gte('dive_date')` / `dateTo` → `lte('dive_date')` / 片側 / 両端含む）。実装前に失敗を確認
- [X] T012 [US1] `service-front/src/features/dives/lib/list-query.ts` の `fetchDiveListPage` に `dateFrom` → `.gte('dive_date', …)` / `dateTo` → `.lte('dive_date', …)` を追加し、旧 `diveDate` の `eq` を削除する。T011 を green に（FR-001）
- [X] T013 [US1] `DiveSearchBar` 詳細パネルに 開始日 / 終了日（`type=date`・`label` 関連付け・範囲エラーは `role="alert"` / `aria-invalid`）を追加する。`DiveSearchBar.test.tsx` / `.stories.tsx` を同期更新（FR-001 / FR-006）

**Checkpoint**: 期間で絞り込め、不正範囲はエラー、フィルタ URL を再読み込みで復元できる（MVP 完成）

---

## Phase 4: User Story 2 - 深度範囲で絞り込む (Priority: P2)

**Goal**: 最大水深の下限・上限で絞り込め、最大水深が未記録のログは除外される

**Independent Test**: 最大水深の異なるログ + 未記録ログがある状態で下限・上限を指定 → 範囲内のみ表示、未記録は出ない（quickstart シナリオ 4）

- [X] T014 [P] [US2] `dive.schema.test.ts` に深度分のケースを追加する（`depthMin`/`depthMax` の 0〜300・`depthMax >= depthMin`・片側のみ許容・不正でエラー — FR-002 / FR-006）。実装前に失敗を確認
- [X] T015 [US2] `dive.schema.ts` の `diveSearchSchema` に `depthMin` / `depthMax`（0〜300 + 相互制約）を追加する。T014 を green に
- [X] T016 [P] [US2] `list-query.test.ts` に深度ケースを追加する（`depthMin` → `gte('max_depth_m')` / `depthMax` → `lte('max_depth_m')` / いずれか指定時に `not('max_depth_m','is',null)` で未記録除外 — FR-002 / Q1）。実装前に失敗を確認
- [X] T017 [US2] `list-query.ts` の `fetchDiveListPage` に深度範囲（`.gte`/`.lte`）と、下限・上限いずれか指定時の `.not('max_depth_m','is',null)` を追加する。T016 を green に（FR-002）
- [X] T018 [US2] `DiveSearchBar` 詳細パネルに 深度下限 / 上限（`type=number`・`min=0` `max=300`・範囲エラー表示）を追加する。`DiveSearchBar.test.tsx` / `.stories.tsx` を同期更新（FR-002）

**Checkpoint**: 深度範囲で絞り込め、未記録ログが除外される。US1 と併用しても破綻しない

---

## Phase 5: User Story 3 - ダイブタイプで絞り込む (Priority: P3)

**Goal**: ダイブタイプ（既存種別）で絞り込め、「指定しない」で解除できる

**Independent Test**: 異なるダイブタイプのログで 1 種別を選択 → その種別のみ表示。「指定しない」で解除（quickstart シナリオ 5〜6）

- [X] T019 [P] [US3] `dive.schema.test.ts` に `diveType` のケースを追加する（`DIVE_TYPE_OPTIONS` の値のみ許容（`oneOf`）・空許容）。実装前に失敗を確認
- [X] T020 [US3] `dive.schema.ts` の `diveSearchSchema` に `diveType`（`oneOf` で `DIVE_TYPE_OPTIONS` の value）を追加する。T019 を green に
- [X] T021 [P] [US3] `list-query.test.ts` に `diveType` → `eq('dive_type')` のケースを追加する。実装前に失敗を確認
- [X] T022 [US3] `list-query.ts` の `fetchDiveListPage` に `diveType` → `.eq('dive_type', …)` を追加する。T021 を green に（FR-003）
- [X] T023 [US3] `DiveSearchBar` 詳細パネルに ダイブタイプ `select`（`DIVE_TYPE_OPTIONS`、先頭に「指定しない」、`label` 関連付け）を追加する。`DiveSearchBar.test.tsx` / `.stories.tsx` を同期更新（FR-003）

**Checkpoint**: 3 軸すべてが独立して、かつ併用（AND）で機能する

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 複合動作・a11y・検証・仕様同期

- [X] T024 [P] `service-front/tests/a11y/dives-pages.spec.ts` に「詳細条件」パネル展開状態での axe スキャンを追加する（disclosure / 日付・数値入力 / select — 憲法 V）
- [X] T025 `DiveList.test.tsx` に複合フィルタ（期間 + 深度 + タイプ + ポイント名の AND）と「N 件適用中」表示・ページネーション越しのフィルタ維持の統合テストを追加する（FR-004 / FR-005 / FR-009 / FR-012）
- [ ] T026 `specs/013-dive-search-filters/quickstart.md` の手動検証シナリオ 1〜12 を実行して確認する
- [X] T027 [P] `/sync-spec specs/013-dive-search-filters` で実装と仕様の整合を確認する

---

## Dependencies & Execution Order

### Phase Dependencies
- Setup(P1) → Foundational(P2) → US1(P3) → US2(P4) → US3(P5) → Polish(P6)
- Foundational 完了まで全ストーリー着手不可（型・URL 同期・パネル基盤が前提）

### User Story Dependencies
- US1/US2/US3 は機能的に独立（各フィルタは AND 合成で互いに非依存）。ただし共有ファイル（`dive.schema.ts` / `list-query.ts` / `DiveSearchBar.tsx`）を追記するため、**同一ファイルを触るストーリー跨ぎタスクは逐次**（[P] 不可）

### Within Each User Story
- スキーマ/クエリのテスト（[P]・別ファイル）→ スキーマ実装 → クエリ実装 → UI 追加 の順
- テストは先に書いて失敗を確認してから実装する

### Parallel Opportunities
- T003（search-params テスト）は単独で並列可
- 各ストーリー内: スキーマテスト（`dive.schema.test.ts`）とクエリテスト（`list-query.test.ts`）は別ファイルのため [P] 可（例: T009 と T011、T014 と T016、T019 と T021）
- T024 / T027 は Polish 内で [P] 可

## Parallel Example: User Story 1

```bash
# US1 のテストを先に並列で書く（別ファイル）:
Task: "dive.schema.test.ts に期間バリデーションのケースを追加"   # T009
Task: "list-query.test.ts に期間クエリのケースを追加"            # T011
```

## Implementation Strategy

### MVP First
1. Phase 1 Setup → Phase 2 Foundational（URL 同期・パネル基盤）
2. Phase 3 US1（期間）まで実装して検証 → これだけで「期間で振り返る + URL 共有」が成立（MVP）

### Incremental Delivery
1. Foundational 完成 → 基盤 OK
2. US1（期間・P1）→ 独立検証 → リリース可（MVP）
3. US2（深度・P2）→ 独立検証
4. US3（ダイブタイプ・P3）→ 独立検証
5. Polish（a11y / 複合 / 仕様同期）

## Notes
- 本機能は DB 変更なし（マイグレーション・RLS の新規作成なし）
- 新規コンポーネントはなく既存 2 つを拡張するため、テストは既存 `*.test.tsx` / `*.stories.tsx` を同期更新（`/generate-with-tests` 不要）
- [P] = 別ファイル・依存なし。同一ファイルへの追記は逐次
- 各タスク完了ごと or 論理単位でコミット
