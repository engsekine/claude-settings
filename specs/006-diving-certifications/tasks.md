---

description: "Task list for diving certifications implementation"
---

# Tasks: ダイビングライセンス保有資格管理

**Input**: Design documents from `/specs/006-diving-certifications/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Constitution III（Test-First）に従い、スキーマ・計算ロジック・Server Actions はテストを先に書く。コンポーネントは `/generate-with-tests` で test / story / a11y を同梱する。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## 前提

- 001 認証・`user_details`（生年月日）が利用可能であること
- Supabase ローカル環境が起動できること（`supabase start`）

---

## Phase 1: Setup (マイグレーション)

**Purpose**: `certifications` テーブルと周辺 DB オブジェクトの作成（[data-model.md](data-model.md) 参照）

- [ ] T001 `supabase/migrations/<timestamp>_create_certifications.sql` を作成（テーブル・comment on・CHECK 制約・複合ユニーク `(user_id, agency, rank)`・インデックス `(user_id, acquired_on desc)`・RLS 4 ポリシー・`updated_at` トリガを 1 ファイルに含める）
- [ ] T002 `make supabase-migration-up` で適用し、Supabase Studio でテーブル定義と RLS を確認

> T001 内のオブジェクトは強い依存関係があるため同一ファイル。並列不可。

---

## Phase 2: Foundational (feature 雛形)

**Purpose**: 全ユーザーストーリーが依存する型・定数・バリデーションスキーマ

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T003 [P] `service-front/src/features/certifications/types.ts` を定義（`Certification` 型・`Agency` ユニオン型）
- [ ] T004 [P] `service-front/src/features/certifications/constants.ts` を定義（agency の値 → 表示ラベルのマッピング: padi → PADI など 6 値）
- [ ] T005 `service-front/src/features/certifications/schemas/certification.schema.test.ts` を作成（必須 3 項目・rank 60 文字上限・未来日付拒否のテストを先に書く。この時点では fail する）
- [ ] T006 `service-front/src/features/certifications/schemas/certification.schema.ts` を実装（yup。T005 のテストをグリーンにする）
- [ ] T007 `service-front/src/features/certifications/index.ts` を作成（再 export 用バレル）

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - 保有資格の登録と一覧表示 (Priority: P1) 🎯 MVP

**Goal**: 指導団体・資格ランク・取得日を複数件登録でき、取得日の新しい順に一覧表示される。未来日付・生年月日以前・重複はエラー。

**Independent Test**: 資格を 1 件登録し、登録内容が一覧に表示されること。不正な取得日と重複登録が拒否されること。

### Tests for User Story 1

- [ ] T008 [US1] `service-front/src/features/certifications/server/actions.test.ts` を作成（createCertification: 正常系 / 生年月日以前の拒否 / 一意制約違反 23505 → 重複メッセージ変換。テストを先に書く）

### Implementation for User Story 1

- [ ] T009 [US1] `service-front/src/features/certifications/server/queries.ts` を実装(`getCertifications`: `acquired_on desc, created_at desc` 全件取得、`getCertificationById`)
- [ ] T010 [US1] `service-front/src/features/certifications/server/actions.ts` に `createCertification` を実装（`user_id` は `auth.uid()` から強制セット、`user_details.birth_on` との比較検証、23505 捕捉。T008 をグリーンにする）
- [ ] T011 [P] [US1] `service-front/src/features/certifications/components/client/CertificationForm/CertificationForm.tsx` を実装（RHF + yup、新規モード。label 関連付け・`aria-invalid`・エラー `role="alert"`）。作成直後に `/generate-with-tests` で test / story を生成
- [ ] T012 [P] [US1] `service-front/src/features/certifications/components/server/CertificationList/CertificationList.tsx` を実装（Server Component。取得日降順の一覧 + 0 件時の未登録案内と登録導線）。作成直後に `/generate-with-tests` で test / story を生成
- [ ] T013 [US1] `service-front/src/app/(authenticated)/settings/certifications/page.tsx` を作成（一覧ページ。`generatePageMetadata` 使用、`Header` / `Footer` を含める）
- [ ] T014 [US1] `service-front/src/app/(authenticated)/settings/certifications/new/page.tsx` を作成（新規登録ページ）

**Checkpoint**: 登録 → 一覧表示が end-to-end で動作し、US1 単独でリリース可能

---

## Phase 4: User Story 2 - 保有期間の自動表示 (Priority: P2)

**Goal**: 各資格に取得日から現在までの保有期間（経過年月・切り捨て）が自動表示される。

**Independent Test**: 3 年 2 ヶ月前の取得日で「3年2ヶ月」、当日取得で「0ヶ月」が表示されること。

### Tests for User Story 2

- [ ] T015 [US2] `service-front/src/features/certifications/lib/heldPeriod.test.ts` を作成（年月差・月末またぎ切り捨て・当日 0ヶ月・表示フォーマットのテストを先に書く）

### Implementation for User Story 2

- [ ] T016 [US2] `service-front/src/features/certifications/lib/heldPeriod.ts` を実装（純粋関数。基準日を引数で受け取る。T015 をグリーンにする）
- [ ] T017 [US2] `CertificationList.tsx` に保有期間表示を統合し、同階層の `CertificationList.test.tsx` / `CertificationList.stories.tsx` を同期更新

**Checkpoint**: 一覧の全資格に保有期間が表示される

---

## Phase 5: User Story 3 - 資格の編集・削除 (Priority: P3)

**Goal**: 登録済み資格の修正と、確認ダイアログ付きの削除ができる。

**Independent Test**: 取得日を変更して一覧に反映されること。削除確認のキャンセルで削除されず、確定で一覧から消えること。

### Tests for User Story 3

- [ ] T018 [US3] `service-front/src/features/certifications/server/actions.test.ts` に updateCertification / deleteCertification のテストを追記（先に書く）

### Implementation for User Story 3

- [ ] T019 [US3] `service-front/src/features/certifications/server/actions.ts` に `updateCertification` / `deleteCertification` を実装（T018 をグリーンにする）
- [ ] T020 [P] [US3] `service-front/src/features/certifications/components/client/DeleteCertificationButton/DeleteCertificationButton.tsx` を実装（確認ダイアログ付き）。作成直後に `/generate-with-tests` で test / story を生成
- [ ] T021 [US3] `CertificationForm.tsx` を編集モード対応（初期値受け取り）に拡張し、同階層の test / story を同期更新
- [ ] T022 [US3] `service-front/src/app/(authenticated)/settings/certifications/[id]/edit/page.tsx` を作成（編集ページ。対象が見つからない場合は notFound）
- [ ] T023 [US3] `CertificationList.tsx` に編集導線と `DeleteCertificationButton` を統合し、test / story を同期更新

**Checkpoint**: 全ユーザーストーリーが独立して動作する

---

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T024 [P] `service-front/src/app/(authenticated)/settings/profile/page.tsx` から `/settings/certifications` への導線を追加（機材管理の導線パターンに合わせる）
- [ ] T025 [P] Playwright a11y テストで一覧・新規・編集の 3 画面の axe-core 違反 0 件を確認（`make front-test-a11y`）
- [ ] T026 [quickstart.md](quickstart.md) の手動検証シナリオ 1〜4 を実施
- [ ] T027 `make front-validate` で型チェック・lint・テストの全チェックをグリーンにする

---

## Dependencies

```text
Phase 1 (T001-T002)
   ↓
Phase 2 (T003-T007)  ※ T003/T004 は並列可、T005 → T006 の順
   ↓
Phase 3: US1 (T008-T014)  ← MVP。T008 → T010、T011/T012 は並列可
   ↓（US2 は US1 の一覧表示に載せるため後続）
Phase 4: US2 (T015-T017)  ※ T015 → T016 → T017
   │
Phase 5: US3 (T018-T023)  ※ US2 と独立。US1 完了後なら US2 と並行着手可
   ↓
Phase 6: Polish (T024-T027)
```

- US2 と US3 は互いに独立しており、US1 完了後に並行して進められる
- T017 と T023 は同一ファイル（`CertificationList.tsx`）を触るため、US2 / US3 を並行する場合はこの 2 タスクのみ直列にする

## Parallel Execution Examples

```text
Phase 2:  T003 types.ts ─┬─ 並列
          T004 constants.ts ─┘

Phase 3:  T011 CertificationForm ─┬─ 並列（T010 完了後）
          T012 CertificationList ─┘

US1 完了後:  Phase 4 (US2) と Phase 5 (US3) を並行着手可（T017/T023 のみ直列）

Phase 6:  T024 導線追加 ─┬─ 並列
          T025 a11y テスト ─┘
```

## Implementation Strategy

1. **MVP first**: Phase 1〜3（T001〜T014）で「登録と一覧」をリリース可能な状態にする
2. **Incremental delivery**: US2（保有期間表示）→ US3（編集・削除）を独立した増分として追加。各 Checkpoint で動作確認してから次へ進む
3. **Test-First**: T005 / T008 / T015 / T018 は対応する実装タスクより必ず先に着手し、fail を確認してから実装する
4. コミット前に `/review` と `/sync-spec` を実施する（Constitution: Development Workflow）
