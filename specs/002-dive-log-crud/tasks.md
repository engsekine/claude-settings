---

description: "Task list for dive log CRUD implementation"
---

# Tasks: ダイブログ CRUD

**Input**: Design documents from `/specs/002-dive-log-crud/`

**Prerequisites**: plan.md, spec.md, data-model.md

**Tests**: 移行元 tasks.md にテストタスクが含まれているため、本タスク一覧にもテストを含める。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

> **移行ノート**: 旧 `docs/specs/features/002-dive-log-crud/tasks.md`（T1〜T25）からの変換。各タスクに旧 ID を併記。実装はコミット「ダイビングログ完成」時点で完了済みだが、移行元のチェックボックスは未更新（全件未チェック）のため、その状態をそのまま保持している。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)

## 前提

- 001 認証が完了していること
- `@repo/supabase` 利用可能
- Supabase ローカル環境が起動できる

---

## Phase 1: Setup (マイグレーション)

**Purpose**: `dives` テーブルと周辺 DB オブジェクトの作成（[data-model.md](data-model.md) 参照）

- [ ] T001 `supabase/migrations/20260525130000_create_dives.sql` を作成（旧 T1）
- [ ] T002 RLS ポリシーを設定（旧 T2）
- [ ] T003 インデックスを作成（旧 T3）
- [ ] T004 `updated_at` 自動更新の trigger 追加（旧 T4）
- [ ] T005 `npx supabase db reset` で適用確認（旧 T5）

> T001〜T004 は同一マイグレーションファイル内のため並列不可。

---

## Phase 2: Foundational (feature 雛形)

**Purpose**: 全ユーザーストーリーが依存する型・スキーマ・データアクセス層

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T006 [P] `service-front/src/features/dives/types.ts` 定義（旧 T6）
- [ ] T007 [P] `service-front/src/features/dives/constants.ts`（dive_type / gas_type の選択肢）（旧 T7）
- [ ] T008 `service-front/src/features/dives/schemas/dive.schema.ts`（yup）（旧 T8、T006/T007 に依存）
- [ ] T009 `service-front/src/features/dives/server/queries.ts`（一覧 / 詳細）（旧 T9）
- [ ] T010 `service-front/src/features/dives/server/actions.ts`（作成 / 更新 / 削除）（旧 T10）
- [ ] T011 `service-front/src/features/dives/hooks/useDives.ts`（TanStack Query）（旧 T11）

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - ダイブの詳細を記録する (Priority: P1) 🎯 MVP

**Goal**: `/dives/new` から必須 4 項目+任意項目でログを作成し、詳細にリダイレクトできる

**Independent Test**: 必須項目を入力して送信し、保存と `/dives/[id]` へのリダイレクト・バリデーションエラー表示を確認

- [ ] T012 [US1] `service-front/src/features/dives/components/client/DiveForm/`（新規・編集共有）（旧 T15）
- [ ] T013 [US1] `/dives/new` 新規作成ページ `service-front/src/app/(authenticated)/dives/new/page.tsx`（旧 T19、T012 に依存）

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - 過去のログを一覧で振り返る (Priority: P2)

**Goal**: `/dives` で日付降順 20 件ずつの一覧 + 「もっと見る」、`/dives/[id]` で全項目表示

**Independent Test**: 複数件のログがある状態で一覧の表示順・ページング・空状態 CTA・詳細表示・他人 id の 404 を確認

- [ ] T014 [P] [US2] `service-front/src/features/dives/components/client/DiveCard/`（一覧の 1 行）（旧 T12）
- [ ] T015 [US2] `service-front/src/features/dives/components/client/DiveList/`（カード並び + ページング）（旧 T13、T014 に依存）
- [ ] T016 [P] [US2] `service-front/src/features/dives/components/server/DiveDetail/`（詳細表示）（旧 T16）
- [ ] T017 [US2] `/dives` 一覧ページ `service-front/src/app/(authenticated)/dives/page.tsx`（旧 T18、T015 に依存）
- [ ] T018 [US2] `/dives/[id]` 詳細ページ `service-front/src/app/(authenticated)/dives/[id]/page.tsx`（旧 T20、T016 に依存）

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - 過去のログを編集・削除する (Priority: P3)

**Goal**: 既存ログの編集（`/dives/[id]/edit`）と確認ダイアログ付き削除

**Independent Test**: 既存ログの更新→詳細リダイレクト、削除→一覧リダイレクト、キャンセル時の無操作、他人 id の 404 を確認

- [ ] T019 [P] [US3] `service-front/src/features/dives/components/client/DeleteDiveButton/`（確認ダイアログ付き）（旧 T17）
- [ ] T020 [US3] `/dives/[id]/edit` 編集ページ `service-front/src/app/(authenticated)/dives/[id]/edit/page.tsx`（旧 T21、T012 / T019 に依存）

**Checkpoint**: At this point, User Stories 1, 2 AND 3 should all work independently

---

## Phase 6: User Story 4 - 日付やポイント名でログを検索する (Priority: P4)

**Goal**: 一覧での日付・ダイブ番号・ポイント名検索（URL クエリ保持・デバウンス 300ms）

**Independent Test**: 検索条件を入力して絞り込み結果・ヒット 0 件メッセージを確認

- [ ] T021 [US4] `service-front/src/features/dives/components/client/DiveSearchBar/`（日付範囲・ポイント名）（旧 T14、T011 / T017 と連携）

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & テスト

**Purpose**: 全ストーリー横断のテストと受け入れ確認

- [ ] T022 [P] yup スキーマ単体テスト（`dive.schema.test.ts`）（旧 T22）
- [ ] T023 [P] Server Actions 単体テスト（旧 T23）
- [ ] T024 E2E（作成 → 一覧表示 → 編集 → 削除）（旧 T24）
- [ ] T025 他ユーザーの dive_id にアクセスして 404 が返ることを確認（旧 T25）

### 受け入れ確認

- [ ] spec.md（旧 requirements.md）の全受け入れ条件を満たす
- [ ] RLS が機能していることを Supabase Studio で確認
- [ ] 21 件以上のログでページングが動作する
- [ ] 検索（日付・ポイント名）が動作する

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし。最初に着手可能
- **Foundational (Phase 2)**: Phase 1 完了に依存。全ユーザーストーリーをブロックする
- **User Stories (Phase 3〜6)**: すべて Phase 2 完了に依存
  - US1（フォーム）と US2（一覧・詳細）は並列着手可能
  - US3 は DiveForm（T012）を再利用するため US1 完了後が効率的
  - US4 は一覧ページ（T017）と `useDives`（T011）に統合するため US2 完了後が効率的
- **Polish (Phase 7)**: 対象ストーリーの完了に依存

### Parallel Opportunities

- T006 / T007（types / constants）は並列可能
- T014（DiveCard）と T016（DiveDetail）は並列可能
- T022 / T023（単体テスト）は並列可能
- Phase 2 完了後、US1 と US2 は別担当者で並列実装可能

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: マイグレーション → Phase 2: feature 雛形
2. Phase 3: US1（記録する）で MVP 成立（作成 → 詳細リダイレクト）
3. 以降 US2 → US3 → US4 の優先度順に増分デリバリー

### Incremental Delivery

1. Setup + Foundational → 基盤完成
2. US1 追加 → 単独テスト → MVP
3. US2 追加 → 単独テスト（一覧・詳細・404）
4. US3 追加 → 単独テスト（編集・削除）
5. US4 追加 → 単独テスト（検索）
6. Phase 7 でテスト整備と受け入れ確認
