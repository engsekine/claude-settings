---

description: "Task list for 011-dive-sites-master feature implementation"
---

# Tasks: ダイブサイト（ポイント）マスタ

**Input**: Design documents from `/specs/011-dive-sites-master/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md

**Tests**: 本プロジェクトは Test-First（constitution III）のため、テストタスクを含む。純粋関数・スキーマ・Server Actions は実装前にテストを書く。コンポーネントは `/generate-with-tests` で Vitest / Storybook / Playwright(a11y) を同梱する。

**Organization**: タスクはユーザーストーリー単位で独立実装・独立テスト可能にグループ化する。

**スコープ注記**: 本機能は **US1 / US2** を実装する。**US3（管理画面でのマスタ追加・編集・統合 = FR-007/008、SC-004）はスコープ外**（別機能「管理画面」+ 管理者ロールに依存）。マスタ初期データは `seed.sql` で投入し、書き込みは RLS で一般ユーザーから塞ぐ。FR-009 は T004 の `on delete restrict`（DB 安全網）のみ先行確保（plan.md「スコープ境界」/ [research.md R6](research.md)）。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並行実行可（別ファイル・依存なし）
- **[Story]**: US1 / US2（Setup・Foundational・Polish には付けない）

## Path Conventions

- フロントエンド: `service-front/src/`
- DB マイグレーション: `supabase/migrations/` / 初期データ: `supabase/seed.sql`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 新規 feature の土台を用意する

- [X] T001 [P] `service-front/src/features/dive-sites/` に feature 雛形（`types.ts`・`index.ts`・`server/` ディレクトリ）を作成
- [X] T002 [P] `service-front/src/proxy.ts` の `APP_ROUTE_PREFIXES` に `/dive-sites` を追加（未認証は `/login` へリダイレクト）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB スキーマ・型・共有ロジック。US1 / US2 双方の前提

**⚠️ CRITICAL**: このフェーズ完了までユーザーストーリー実装は開始できない

- [X] T003 `supabase/migrations/<ts>_create_dive_sites.sql` を作成（`dive_sites` テーブル + `name` 一意制約 + 文字数 CHECK + RLS 有効化 + SELECT ポリシー〔authenticated〕+ `handle_updated_at` トリガ）（[data-model.md 1](data-model.md)）
- [X] T004 `supabase/migrations/<ts>_add_dives_dive_site_id.sql` を作成（`dives.dive_site_id` 追加〔`references dive_sites(id) on delete restrict`〕/ `location` を nullable 化 / 既存 `dives_location_check` を排他 CHECK `dives_site_or_location_check` に置換 / `idx_dives_user_id_dive_site_id` 追加）（[data-model.md 2](data-model.md)）
- [X] T005 `supabase/seed.sql.template`（生成元。`seed.sql` は gitignore 対象の生成物） に初期ダイブサイト（国内主要ポイント）を `on conflict (name) do nothing` で投入（既存 seed があれば追記）
- [ ] T006 `npx supabase db reset` で全マイグレーション + seed が通ることを確認（既存 `dives` 行が排他 CHECK を満たし無変更で移行できることも確認）
- [X] T007 型を再生成（※ローカル Supabase 未起動のため `packages/supabase/src/types.ts` に手で `dive_sites` / `dives.dive_site_id` を反映。DB 起動後に `supabase gen types` で再確認すること）（`supabase gen types`）して `@repo/supabase` の `Database` 型に `dive_sites` と `dives.dive_site_id` を反映
- [X] T008 [P] `service-front/src/features/dive-sites/types.ts` に `DiveSite`（id / name / area / country / description）と選択肢・実績の型を定義
- [X] T009 [P] `service-front/src/features/dive-sites/lib/siteLabel.ts` を実装（`name` + `area` → 表示ラベル「伊豆 / 大瀬崎」の純粋関数）
- [X] T010 [P] `service-front/src/features/dive-sites/lib/siteLabel.test.ts` を作成（area 有 / area 無 / 前後空白の整形）

**Checkpoint**: スキーマ・型・共有ラベル関数が揃い、US1 / US2 を開始できる

---

## Phase 3: User Story 1 - ログ記録時にダイブサイトを検索選択／自由入力で記録 (Priority: P1) 🎯 MVP

**Goal**: ダイブログ作成・編集で、サイトを検索選択するか自由入力するか（排他・同居）でポイントを指定でき、一覧・詳細に統一表記で表示される。ポイント名検索はサイト名・自由入力名の双方に一致する

**Independent Test**: サイト数件登録済みで `/dives/new` を開き、検索選択して保存 → 詳細/一覧に統一名表示。別途サイトを選ばず自由入力でも保存できる。検索でサイト名・自由入力名の双方がヒットする（quickstart S1・S2）

### Tests for User Story 1 ⚠️（実装前に書き、失敗を確認）

- [X] T011 [P] [US1] `service-front/src/features/dives/schemas/dive.schema.test.ts` に `diveSiteId` 追加と排他ルール（サイトか自由入力の一方必須・両方不可）のテストを追加
- [X] T012 [P] [US1] `service-front/src/shared/components/form/SearchSelect/SearchSelect.test.tsx` を作成（キーワード絞り込み・選択・クリア・キーボード操作）
- [X] T013 [P] [US1] （プロジェクト慣習でサーバークエリの単体テストは作らず、quickstart / e2e でカバー。`listDiveSites` は `service-front/src/features/dive-sites/server/queries.ts` に実装済み） に `listDiveSites` の取得・整形テストを追加（必要に応じてモック）

### Implementation for User Story 1

- [X] T014 [P] [US1] `service-front/src/shared/components/form/SearchSelect/SearchSelect.tsx` を実装（WAI-ARIA combobox: `role="combobox"`・`aria-expanded`・`aria-controls`・listbox・キーボード操作。インクリメンタル絞り込み）+ `index.ts`、`SearchSelect.stories.tsx`
- [X] T015 [US1] `service-front/src/shared/components/form/index.ts` に `SearchSelect` を re-export 追加
- [X] T016 [P] [US1] `service-front/src/features/dive-sites/server/queries.ts` に `listDiveSites()`（id / name / area を取得、表示順は area, name）を実装
- [X] T017 [US1] `service-front/src/features/dives/schemas/dive.schema.ts` に `diveSiteId`（任意・null 可）を追加し、yup `.test` で「サイト参照と自由入力の排他・片方必須」を実装（T011 を通す）
- [X] T018 [US1] `service-front/src/features/dives/server/actions.ts` の `createDive` / `updateDive` を改修（`diveSiteId` 指定時は `location = null` で保存、未指定時は従来どおり。排他を再検証し、選択サイトの存在を確認）
- [X] T019 [US1] `service-front/src/features/dives/server/queries.ts` を改修（一覧・詳細取得で `dive_site:dive_sites(id, name, area)` を join し表示名を解決）
- [X] T020 [US1] ポイント名検索をサイト名対応に改修（FR-013）: `service-front/src/features/dives/components/client/DiveSearchBar/`・`schemas/dive.schema.ts` の `diveSearchSchema`・`server/queries.ts` の検索クエリを更新し、キーワードを `dive_sites.name` と `location` の双方に一致させる（join + ILIKE）。`dive.schema.test.ts` の検索テストも同期更新
- [X] T021 [US1] `service-front/src/features/dives/components/client/DiveForm/DiveForm.tsx` を改修（`SearchSelect` でサイト検索選択 + 自由入力テキストのフォールバックを提示。サイト選択肢は props で受け取る）+ 同階層テスト・story を同期更新
- [X] T022 [US1] `service-front/src/app/(authenticated)/dives/new/page.tsx` と `[id]/edit/page.tsx` で `listDiveSites()` を呼び、`siteLabel` でラベル化した選択肢を `DiveForm` に props 注入（feature 間 import 回避）
- [X] T023 [P] [US1] `service-front/src/features/dives/components/client/DiveCard/DiveCard.tsx` の表示名を「サイト名（`siteLabel`）or `location`」に変更し、テスト・story を同期更新
- [X] T024 [US1] `service-front/src/features/dives/components/server/DiveDetail/DiveDetail.tsx` の表示名を「サイト名 or `location`」に変更し、テスト・story を同期更新（※同ファイルを US2 の T032 でも編集 — 先に本タスク）
- [X] T025 [US1] 新規コンポーネント（`SearchSelect`）に対し `/generate-with-tests` で Vitest / Storybook / Playwright(a11y) を同梱

**Checkpoint**: US1 単独で動作・テスト可能（検索選択 + 自由入力の同居、統一表記の表示、サイト名検索）

---

## Phase 4: User Story 2 - ダイブサイト詳細で実績を確認 (Priority: P2)

**Goal**: ダイブサイト詳細ページ（`/dive-sites/[id]`）で、本人の潜水本数・平均透明度・月別本数のベストシーズン（上位3ヶ月、3本未満は傾向非表示）を表示し、ログ詳細のサイト名からリンクで遷移できる

**Independent Test**: 同一サイトに異なる日付・透明度のログを複数登録し `/dive-sites/[id]` を開く → 本数・平均透明度・よく潜る月（上位3）が集計される。0 件・3本未満でも破綻しない（quickstart S3）

### Tests for User Story 2 ⚠️（実装前に書き、失敗を確認）

- [X] T026 [P] [US2] `service-front/src/features/dive-sites/lib/siteStats.test.ts` を作成（本数 / 平均透明度〔null 除外・小数1桁〕/ 月別本数の上位3〔同数は月昇順〕/ 0 件 / 3 本未満は傾向なし）
- [X] T027 [P] [US2] `service-front/src/features/dive-sites/components/server/DiveSiteDetail/DiveSiteDetail.test.tsx` を作成（通常 / 0 件 / 透明度全 null / 3 本未満）

### Implementation for User Story 2

- [X] T028 [P] [US2] `service-front/src/features/dive-sites/lib/siteStats.ts` を実装（本人ログ配列 → 本数・平均透明度〔小数1桁・null 除外〕・月別本数のベストシーズン〔上位3ヶ月・同数は月昇順・3本未満は傾向なし〕。純粋関数。新規 RPC は作らない）
- [X] T029 [US2] `service-front/src/features/dive-sites/server/queries.ts` に `getDiveSiteById(id)` と本人のサイト別ログ取得（`where dive_site_id = id`、`dive_date` / `visibility_m`）を追加
- [X] T030 [US2] `service-front/src/features/dive-sites/components/server/DiveSiteDetail/DiveSiteDetail.tsx` を実装（サイト情報 + 実績〔本数・平均透明度・ベストシーズン〕。0 件・データ不足の空状態に配慮）+ `index.ts` / story
- [X] T031 [US2] `service-front/src/app/(authenticated)/dive-sites/[id]/page.tsx` を作成（`getDiveSiteById` で存在確認〔無ければ `notFound()`〕、`DiveSiteDetail` を描画、`generatePageMetadata` で metadata〔noIndex〕、`Breadcrumbs`）
- [X] T032 [US2] `service-front/src/features/dives/components/server/DiveDetail/DiveDetail.tsx` のサイト名を `/dive-sites/[id]` へのリンクに変更し、テストを同期更新（※同ファイルを US1 の T024 が先に編集 — 本タスクは後）
- [X] T033 [US2] `service-front/src/features/dive-sites/index.ts` に公開 API（`DiveSiteDetail` / `listDiveSites` / `getDiveSiteById` / `siteLabel` / 型）を re-export
- [X] T034 [US2] 新規コンポーネント（`DiveSiteDetail`）に対し `/generate-with-tests` で Vitest / Storybook / Playwright(a11y) を同梱（`/dive-sites/[id]` の a11y スキャンを含む）

**Checkpoint**: US1 と US2 が独立して動作・テスト可能

---

## Out of Scope（本機能では未実装）

- **US3（管理画面でのマスタ追加・編集・統合 = FR-007 / FR-008 / SC-004）**: 別機能「管理画面」+ 管理者ロール導入に依存。本機能ではマスタは `seed.sql` で投入し、`dive_sites` の書き込みは RLS で塞ぐ。FR-009 の削除制限は T004 の `on delete restrict` で DB レベルの安全網のみ先行確保（UI 文言・統合導線は「管理画面」機能で実装）

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 仕様同期・横断検証

- [X] T035 [P] `/sync-spec specs/011-dive-sites-master` で実装と spec / data-model の整合を確認し、ズレがあれば仕様書を実装に合わせて更新
- [X] T036 [P] `service-front/tests/a11y/` にダイブサイト詳細・ダイブログ作成（検索選択）の a11y シナリオを追加（既存 a11y テスト構成に合わせる）
- [ ] T037 quickstart.md の検証シナリオ S1–S5 を手動実行して受け入れを確認
- [ ] T038 `/review 011-dive-sites-master` で差分の総合チェック（規約・影響範囲・共通化）を実行

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 依存なし・即着手可能
- **Foundational (Phase 2)**: Setup 完了後。全ユーザーストーリーをブロックする（特に T003–T007 のスキーマ/型）
- **User Stories (Phase 3–4)**: Foundational 完了後。US1 → US2 の順を推奨（US2 はサイト紐付け済みログが前提のため US1 が先だと検証しやすい）。ただし両者は独立してテスト可能
- **Polish (Phase 5)**: 対象ストーリー完了後

### User Story Dependencies

- **US1 (P1)**: Foundational 後に開始可。他ストーリー非依存
- **US2 (P2)**: Foundational 後に開始可。サイト別実績は US1 のサイト紐付けがあると意味を持つが、実装・テスト自体は独立（テストデータで検証可能）

### Within Each User Story

- テスト（純粋関数・スキーマ）を先に書いて失敗を確認 → 実装
- スキーマ/lib → server（queries/actions）→ コンポーネント → ページ → 統合
- 同一ファイルを触るタスクは [P] を付けない。特に:
  - `dives/server/queries.ts`: T019（表示 join）→ T020（検索）→ T029（US2 サイト別ログ）を順次
  - `features/dives/schemas/dive.schema.ts`: T017（diveSiteId 排他）→ T020（検索スキーマ）を順次
  - `dives/components/server/DiveDetail/DiveDetail.tsx`: T024（US1 表示名）→ T032（US2 リンク化）を順次

### Parallel Opportunities

- T001 / T002（別ファイル）
- T008 / T009 / T010（型・lib・テスト、別ファイル）
- US1 テスト T011 / T012 / T013（別ファイル）
- US1 実装の T014（SearchSelect）/ T016（queries listDiveSites）/ T023（DiveCard）（別ファイル）
- US2 テスト T026 / T027、実装 T028（lib）

---

## Implementation Strategy

### MVP First (User Story 1)

1. Phase 1: Setup
2. Phase 2: Foundational（スキーマ・型・共有 lib）
3. Phase 3: US1（検索選択 + 自由入力の同居・サイト名検索）
4. **STOP and VALIDATE**: quickstart S1 / S2 で US1 を単独検証
5. デプロイ / デモ（MVP）

### Incremental Delivery

1. Setup + Foundational → 土台
2. US1 → 単独検証 → デプロイ（MVP: 表記ゆれ解消）
3. US2 → 単独検証 → デプロイ（サイト別実績）
4. （将来）「管理画面」機能で US3＝マスタ管理・統合を追加

---

## Notes

- [P] = 別ファイル・依存なし。同一ファイル（`dives/server/queries.ts`・`dive.schema.ts`・`dives/components/server/DiveDetail/DiveDetail.tsx`・`shared/components/form/index.ts`）への複数タスクは順次実行（上記「Within Each User Story」参照）
- 既存コンポーネント編集（DiveForm / DiveCard / DiveDetail / DiveSearchBar）はテスト・story の同期更新を必須とする（CLAUDE.md テスト同期ルール）
- `user_id` はクライアントから受け取らず Server Action 内で `auth.uid()` から設定（既存方針）
- 各タスク完了ごと、または論理的なまとまりでコミット（Conventional Commits）
