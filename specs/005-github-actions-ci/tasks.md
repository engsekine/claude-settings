# Tasks: CI/CD 整備（GitHub Actions）

**Input**: Design documents from `/specs/005-github-actions-ci/`

**Prerequisites**: plan.md / spec.md / research.md / quickstart.md

**Tests**: ワークフロー自体の検証は実 PR での動作確認（quickstart のシナリオ）で行う。検証タスクを各 Story に含める。

**Organization**: User Story 単位の Phase 構成。US1（PR チェック）が MVP。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能
- **[US1..US3]**: spec.md の User Story 対応

**注意**: 検証タスク（T004 以降）は GitHub へのブランチ push と PR 作成を伴う。

---

## Phase 1: Setup

**Purpose**: CI 化するコマンドがローカルで全て通る状態を確認する（SC-003 の前提）

- [x] T001 CI が実行する 5 コマンドをローカルで実行し全て成功することを確認: `npm run check --workspace service-front` / `npm run lint:markup --workspace service-front` / `npm run type-check --workspace service-front` / `npm run test:coverage --workspace service-front` / `npx supabase db lint`。失敗するものがあればこのタスク内で修正する（CI 追加前にローカルをグリーンにする）

---

## Phase 2: Foundational

なし（ワークフロー追加に共通基盤は不要。Phase 1 完了後に各 Story へ直行できる）

---

## Phase 3: User Story 1 - PR を出すと品質チェックが自動実行される (Priority: P1) 🎯 MVP

**Goal**: PR で 5 つの独立チェックが並列実行され、結果が PR 上で個別に分かる

**Independent Test**: グリーンな PR で 5 チェック成功 → 型エラー入り push で `type-check` のみ失敗 → 修正で回復、を確認できる

- [x] T002 [US1] `.github/workflows/ci.yml` を作成: トリガー `pull_request` + `push: branches: [main]`、`concurrency`（group = `ci-${{ github.ref }}`、main 以外は cancel-in-progress — FR-003）、並列 5 ジョブ（plan.md「ジョブ構成」どおり）: `lint` / `markup-lint` / `type-check` / `unit-test`（`test:coverage` でカバレッジ閾値検証）/ `db-lint`（`supabase/setup-cli@v1` → `supabase db start` → `supabase db lint`）。Node ジョブは `actions/checkout@v4` → `actions/setup-node@v4`（node 22 / `cache: 'npm'`）→ `npm ci`。シークレット参照なし（FR-008）
- [x] T003 [US1] ワークフローの静的検証: `actionlint`（無ければ `brew install actionlint` か `npx @action-validator/cli`）で `.github/workflows/ci.yml` の構文・式エラーがないことを確認
- [ ] T004 [US1] 検証ブランチを push して PR を作成し、`gh pr checks --watch` で 5 チェック全て成功 + 所要 10 分以内を確認（quickstart シナリオ 1 / SC-001）
- [ ] T005 [US1] 同 PR に型エラーを含む commit を push し、`type-check` のみ失敗・ログから該当行を特定できること、修正 push で成功に戻ることを確認（quickstart シナリオ 2 / SC-002 / FR-004・006）
- [ ] T006 [US1] 連続 push で旧実行がキャンセルされること（SC-004）と、失敗ジョブを `gh run rerun --failed` で個別再実行できること（FR-009）を確認

**Checkpoint**: PR の品質ゲートが機能 — MVP 完了

---

## Phase 4: User Story 2 - main ブランチの健全性を常時保証する (Priority: P2)

**Goal**: main push でも同一チェックが走り、壊したコミットを特定できる

**Independent Test**: PR マージ後、main 上で `ci.yml` の実行履歴とコミットステータスを確認できる

- [ ] T007 [US2] T004 の検証 PR をマージし、`gh run list --branch main --workflow ci.yml` で main 上の実行と成功ステータスを確認（FR-002。トリガーは T002 で設定済みのため検証のみ）

**Checkpoint**: main が常時検証される状態

---

## Phase 5: User Story 3 - 重いテストを main マージ時に自動実行する (Priority: P3)

**Goal**: main push で Supabase 起動 → E2E / a11y、Storybook テストが自動実行される

**Independent Test**: main への push で `full-test.yml` が起動し、シードユーザーでの E2E ログインを含む全テストが成功する

- [x] T008 [US3] `.github/workflows/full-test.yml` を作成: トリガー `push: branches: [main]` のみ（FR-011）。`e2e` ジョブ = checkout / setup-node + `npm ci` / `supabase/setup-cli@v1` → `supabase start` → `supabase db reset`（シード投入）→ `supabase status -o env` から `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` を `service-front/.env` に生成（research.md Decision 6。シークレット不使用）→ `npx playwright install chromium --with-deps` → `npm run test:e2e --workspace service-front` → 失敗時 `service-front/playwright-report` を `actions/upload-artifact@v4` で保存。`storybook-test` ジョブ = checkout / setup-node + `npm ci` → `npx playwright install chromium --with-deps` → `npm run test:storybook --workspace service-front`（DB 不要・e2e と並列）
- [x] T009 [US3] `actionlint` で `.github/workflows/full-test.yml` を静的検証
- [ ] T010 [US3] main へのマージ（または検証用 push）で `full-test.yml` の起動と全ジョブ成功を `gh run watch` で確認。意図的に a11y 違反を含めた場合に失敗がレポートされることも 1 度確認できれば理想（任意）

**Checkpoint**: 全 Story 完了

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T011 [P] `specs/005-github-actions-ci/ci.md` を作成: ワークフロー 2 本の概要表（トリガー / ジョブ / 所要時間目安）、branch protection（Settings → Branches → main → required status checks に `lint` / `markup-lint` / `type-check` / `unit-test` / `db-lint` を設定）の手順、失敗時の調査方法（ログ / playwright-report artifact）
- [ ] T012 [P] 仕様書との同期確認: plan.md「ジョブ構成」のジョブ名と実 YAML の `jobs.<id>` が一致していること、quickstart.md の全シナリオが完了していることを確認し、`specs/005-github-actions-ci/spec.md` の Status を Implemented に更新。branch protection の実設定（GitHub UI での手動作業）をユーザーに案内

---

## Dependencies

```text
Phase 1 (T001) ─→ US1 (T002→T003→T004→T005→T006) ─→ US2 (T007) ─→ US3 (T008→T009→T010) ─→ Polish
```

- T002 → T003 → T004（YAML 作成 → 静的検証 → 実 PR 検証）の順は必須
- US2（T007）は US1 の検証 PR を流用するため US1 完了後
- US3 は US1 と独立に実装可能だが、検証（T010）は main push を使うため T007 と同じマージで兼ねられる
- T011 / T012 は並列可能

## Parallel Execution Examples

- T008（full-test.yml 作成）は T004〜T007 の検証作業と並行で作成可能（検証のみ main マージ待ち）
- Polish の T011 / T012 は並列

## Implementation Strategy

1. **MVP = Phase 1 + US1（T001〜T006）**: PR 品質ゲートだけで価値が出る
2. US2 はトリガー設定済みのため検証のみ。US3 を追加して main のフルテストを有効化
3. 検証は 1 つの「CI 動作確認用 PR」を使い回す（グリーン確認 → 型エラー → 修正 → キャンセル確認 → マージで US2 / US3 の検証まで完結させる）
