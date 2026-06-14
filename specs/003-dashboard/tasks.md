---

description: "Task list for 003-dashboard feature implementation"
---

# Tasks: ダッシュボード（TOP / 累計統計 / レギュレーターオーバーホール）

**Input**: Design documents from `/specs/003-dashboard/`

**Prerequisites**: plan.md, spec.md

**Tests**: 元仕様でテストタスクが明示されているため、テストタスクを含む。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**前提条件（元仕様より）**:

- 001 認証 / 002 ログ CRUD が完了していること
- `@repo/supabase` 利用可能
- Supabase ローカル環境が起動できる

**トレーサビリティ**: 各タスク末尾の `（旧 T◯）` は旧仕様の元タスク番号。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- フロントエンド: `service-front/src/`
- DB マイグレーション: `supabase/migrations/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 認証ルーティングの整備（全ストーリーの前提）

- [x] T001 `service-front/src/proxy.ts` の `APP_ROUTE_PREFIXES` に `/` と `/settings` を追加（旧 T8）
- [x] T002 未認証で `/` にアクセスすると `/login` にリダイレクトされることを確認（旧 T9）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB スキーマ・RPC・型生成。ユーザーストーリー実装の前提

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 `supabase/migrations/<ts>_create_regulators.sql` を作成（テーブル + 制約 + 部分ユニーク）（旧 T1）
- [x] T004 `regulators` の RLS ポリシー（select/insert/update/delete を `(select auth.uid()) = user_id` で）（旧 T2）
- [x] T005 インデックス `idx_regulators_user_id_is_primary`（旧 T3）
- [x] T006 `updated_at` 自動更新 trigger（`handle_updated_at` を再利用）（旧 T4）
- [x] T007 [P] RPC `get_dive_stats()` を `supabase/migrations/<ts>_create_get_dive_stats.sql` で作成（`stable security invoker search_path=''`）（旧 T5）
- [x] T008 `npx supabase db reset` で全マイグレーションが通ることを確認（旧 T6）
- [x] T009 型を再生成（`supabase gen types`）して `@repo/supabase` の Database 型を更新（旧 T7）

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - ダッシュボードで累計統計と最近のログを確認する (Priority: P1) 🎯 MVP

**Goal**: TOP（`/`）を認証必須のダッシュボードに置き換え、累計統計 4 種・ヒーロー・最近のログ 5 件を表示する

**Independent Test**: ダイブログ登録済みユーザーでログインして `/` を開き、統計 4 種・直近 5 件・「新しいログを記録」CTA が表示される。レギュレーター機能とは独立に確認可能

### Implementation for User Story 1

- [x] T010 [P] [US1] `service-front/src/features/dashboard/types.ts` 定義（`DiveStats`、`RegulatorOverhaulStatus` など。後者は US3 でも使用）（旧 T17）
- [x] T011 [US1] `service-front/src/features/dashboard/server/queries.ts` に `getDiveStats` を実装（RPC `get_dive_stats()` 呼び出し）（旧 T19 の一部）
- [x] T012 [US1] `StatsCards`（統計カード × 4 を表示）を `service-front/src/features/dashboard/components/server/StatsCards/` に作成（旧 T20）
- [x] T013 [P] [US1] `RecentDives`（最近 5 件、`listDives({ limit: 5 })` を再利用）を `service-front/src/features/dashboard/components/server/RecentDives/` に作成（旧 T23）
- [x] T014 [US1] `TopDashboard`（Server Component、各セクションを組み立てる）を `service-front/src/features/dashboard/components/server/TopDashboard/` に作成（旧 T24）
- [x] T015 [US1] `service-front/src/app/page.tsx` を書き換えて `TopDashboard` を描画（旧 T25）

### Tests for User Story 1

- [x] T016 [P] [US1] `StatsCards` テスト（0 件 / 通常 / 60 分未満 / 100 時間超 の表示）（旧 T33）
- [x] T017 [P] [US1] E2E: 未認証 `/` → `/login` リダイレクト（旧 T35）

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - レギュレーターを登録して管理する (Priority: P2)

**Goal**: `/settings/equipment` でレギュレーターの一覧・新規登録・編集・削除ができる

**Independent Test**: 認証済みユーザーで `/settings/equipment` を開き、登録 → 一覧 → 編集 → 削除の一連の操作を TOP 表示とは独立に確認できる

### Implementation for User Story 2

- [x] T018 [P] [US2] `service-front/src/features/regulators/types.ts` 定義（`Regulator`、`RegulatorListItem` など）（旧 T10）
- [x] T019 [P] [US2] `service-front/src/features/regulators/schemas/regulator.schema.ts`（yup）（旧 T11）
- [x] T020 [US2] `service-front/src/features/regulators/server/queries.ts`（`listRegulators` / `getRegulator`）（旧 T12）
- [x] T021 [US2] `service-front/src/features/regulators/server/actions.ts`（`createRegulator` / `updateRegulator` / `deleteRegulator`。`recordOverhaul` は US4 = T035）（旧 T13 の一部）
- [x] T022 [US2] `RegulatorList`（Server Component、一覧）を `service-front/src/features/regulators/components/server/RegulatorList/` に作成（旧 T14）
- [x] T023 [US2] `RegulatorForm`（Client Component、新規・編集共通）を `service-front/src/features/regulators/components/client/RegulatorForm/` に作成（旧 T15）
- [x] T024 [US2] `DeleteRegulatorButton`（確認ダイアログ付き）を `service-front/src/features/regulators/components/client/DeleteRegulatorButton/` に作成（旧 T16）
- [x] T025 [US2] `service-front/src/app/(authenticated)/settings/equipment/page.tsx` を作成（`RegulatorList` を描画）（旧 T26）
- [x] T026 [P] [US2] `service-front/src/app/(authenticated)/settings/equipment/new/page.tsx`（旧 T27）
- [x] T027 [P] [US2] `service-front/src/app/(authenticated)/settings/equipment/[id]/edit/page.tsx`（旧 T28）

### Tests for User Story 2

- [x] T028 [P] [US2] `regulator.schema.ts` 単体テスト（必須・最大長・未来日付・interval 範囲）（旧 T31）
- [x] T029 [P] [US2] `RegulatorForm` テスト（送信成功・バリデーションエラー）（旧 T32）
- [x] T030 [US2] 他ユーザーの `regulators.id` で 404 が返ることを確認（旧 T37）

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - TOP でレギュレーターの OH 期限を把握する (Priority: P3)

**Goal**: TOP にメイン機材の OH ステータス（余裕 / 期限間近 / 期限切れ）を表示する。未登録時は設定 CTA を表示

**Independent Test**: レギュレーター登録済みユーザーで TOP を開き、`last_overhauled_on`・周期・ダイブ本数の組み合わせを変えて 3 段階のステータス表示と未登録時 CTA を確認できる

### Implementation for User Story 3

- [x] T031 [P] [US3] `service-front/src/features/dashboard/lib/overhaul.ts`（OH ステータス計算の純粋関数 `calcOverhaulStatus`）（旧 T18）
- [x] T032 [US3] `service-front/src/features/dashboard/server/queries.ts` に `getPrimaryRegulatorStatus` を実装（OH 以降のダイブ本数取得 + 純粋関数呼び出し）（旧 T19 の一部）
- [x] T033 [US3] `RegulatorPanel`（OH ステータス、未登録時の CTA、レベル別色分け）を `service-front/src/features/dashboard/components/server/RegulatorPanel/` に作成（旧 T21）

### Tests for User Story 3

- [x] T034 [P] [US3] `overhaul.ts` 単体テスト（境界: 残日数 0 / 30 / 31、残本数 0 / 10 / 11）（旧 T30）
- [x] T035 [P] [US3] `RegulatorPanel` テスト（未登録 / 余裕 / 期限間近 / 期限切れ）（旧 T34）

**Checkpoint**: User Stories 1-3 should now be independently functional

---

## Phase 6: User Story 4 - OH 完了をワンタップで記録する (Priority: P4)

**Goal**: TOP の OH カードから確認ダイアログ経由で `last_overhauled_on = 今日` を記録し、ステータスを即時更新する

**Independent Test**: メイン機材登録済みユーザーで TOP の「メンテ完了を記録」を押し、確認 → 記録 → ステータス再計算の流れを確認できる

### Implementation for User Story 4

- [x] T036 [US4] `service-front/src/features/regulators/server/actions.ts` に `recordOverhaul(regulatorId)` を実装（`last_overhauled_on = 今日` + `revalidatePath('/')`）（旧 T13 の一部）
- [x] T037 [US4] `RecordOverhaulButton`（Client Component、確認ダイアログ + Server Action 呼び出し）を `service-front/src/features/dashboard/components/client/RecordOverhaulButton/` に作成（旧 T22）

### Tests for User Story 4

- [x] T038 [US4] E2E: レギュレーター登録 → TOP に反映 → メンテ完了記録 → 残日数リセット（旧 T36）

**Checkpoint**: All user stories should now be independently functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 全ストーリー横断の仕上げ・ドキュメント整備

- [x] T039 [P] 各ページに `generatePageMetadata` で metadata を付与（旧 T29）
- [x] T040 [P] `specs/003-dashboard/screens/top.md` の TBD を確定値に書き換える（旧 T38）
- [x] T041 [P] `specs/003-dashboard/data-model.md` を新規作成（regulators テーブル。マイグレーション確定後）（旧 T39）
- [x] T042 [P] `docs/product.md` の機能仕様一覧を更新（003 を Dashboard に、PDF / 公開を 004 / 005 に）（旧 T40）
- [x] T043 `Header` / `Breadcrumbs` の「ホーム」リンク先を `/` に整合（旧 T41）

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし。即着手可能
- **Foundational (Phase 2)**: Setup 完了後。全ユーザーストーリーをブロックする
- **User Stories (Phase 3-6)**: すべて Foundational 完了後
  - US1（P1）は他ストーリーに依存しない
  - US2（P2）は US1 と独立に実装・テスト可能
  - US3（P3）は表示データの前提として US2（機材登録）があると検証しやすいが、コードとしては独立に実装可能
  - US4（P4）は US3 の `RegulatorPanel` 上にボタンを配置するため、US3 完了後が望ましい
- **Polish (Phase 7)**: 対象ストーリー完了後

### Within Each User Story

- 型 → クエリ / スキーマ → コンポーネント → ページ → テストの順
- T014（TopDashboard）は T012・T013 完了後。T033（RegulatorPanel）と T037（RecordOverhaulButton）は完成後に TopDashboard へ組み込む
- T032 は T031（純粋関数）完了後

### Parallel Opportunities

- T010 / T013、T018 / T019、T026 / T027、T028 / T029、T031 / T034 / T035 など [P] マーカーのタスクは並列実行可能
- Foundational 完了後、US1 と US2 は別担当者で並行作業可能

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup（ルーティング）
2. Phase 2: Foundational（マイグレーション・RPC・型生成）
3. Phase 3: US1（ダッシュボード + 統計 + 最近のログ）
4. **STOP and VALIDATE**: 未認証リダイレクト・統計表示・0 件表示を独立検証
5. 以降 US2 → US3 → US4 を優先度順にインクリメンタルに追加

---

## 受け入れ確認（元仕様の最終チェックリスト）

- [ ] spec.md（旧 requirements.md）の全受け入れ条件を満たす
- [ ] 未認証で `/` にアクセスすると `/login` に遷移する
- [ ] 認証済みで `/` にアクセスすると累計統計とメイン機材 OH が表示される
- [ ] ダイブログ 0 件のときも TOP がエラーなく描画される
- [ ] レギュレーター未登録のときも TOP がエラーなく描画される
- [ ] 「メンテ完了を記録」を押すと OH ステータスが即座に更新される
- [ ] 他ユーザーのレギュレーターは RLS で読み書きできない
- [ ] 全カラーコントラスト比が WCAG AA を満たす（特に警告 / エラー色）
