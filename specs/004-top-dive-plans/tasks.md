# Tasks: TOP ページ拡張（ダイビング予定 / 持ち物リスト）

**Input**: Design documents from `/specs/004-top-dive-plans/`

**Prerequisites**: plan.md / spec.md / data-model.md / research.md / quickstart.md

**Tests**: constitution（III. Test-First）と plan.md のテスト方針に従い、テストタスクを含む。スキーマ・lib はテスト先行ペア、コンポーネントタスクも**テスト・story を先に用意してから実装**する（または `/generate-with-tests` を活用）。

**Organization**: User Story 単位の Phase 構成。各 Story は独立して実装・検証できる。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可能（異なるファイル・未完了タスクへの依存なし）
- **[US1..US3]**: spec.md の User Story 対応

---

## Phase 1: Setup（DB とルーティングの土台）

**Purpose**: スキーマとアクセス制御の前提を整える

- [x] T001 マイグレーション `supabase/migrations/<YYYYMMDDHHMMSS>_create_dive_plans.sql` を作成（`dive_plans` + `plan_packing_items`。カラム・CHECK・FK・インデックス・RLS 8 ポリシー・updated_at トリガ・comment on は [data-model.md](data-model.md) の定義どおり）
- [x] T002 マイグレーション適用（`npx supabase migration up`）+ 生成型の再生成（`npx supabase gen types typescript --local > packages/supabase/src/types.ts`）。`dive_plans` / `plan_packing_items` の Row 型が生成されることを確認
- [x] T003 [P] `service-front/src/proxy.ts` の `APP_ROUTE_PREFIXES` に `/plans` を追加（FR-016。関連テストがあれば同期）
- [x] T004 [P] feature 骨組みを作成: `service-front/src/features/plans/{index.ts,constants.ts,types.ts}`（空の公開 API から開始）

**Checkpoint**: マイグレーション適用済み・`/plans` が認証ガード下にある

---

## Phase 2: Foundational（全 Story が依存する共通部品）

**Purpose**: スキーマ・純粋関数・型。テスト先行で作る

- [x] T005 [P] `service-front/src/features/plans/schemas/plan.schema.test.ts` を作成（planSchema: 予定日必須 + `YYYY-MM-DD` 形式 / ポイント名必須 1〜120 字 / メモ任意 ≤2000 字。packingItemSchema: 名称必須 1〜60 字。FR-002〜003 の境界値）
- [x] T006 `service-front/src/features/plans/schemas/plan.schema.ts` を実装し T005 をパスさせる（transform は既存 `dive.schema.ts` の文字列 transform パターンと `@/shared/schemas/transforms` の `optionalNumber` を踏襲、未来日強制はしない — research.md Decision 4）
- [x] T007 [P] `service-front/src/features/plans/lib/days-until.test.ts` を作成（今日 = 0 /「あと N 日」/ 過去 = 負値 / 月跨ぎ・年跨ぎの境界値。`today` を引数で渡す決定的テスト）
- [x] T008 `service-front/src/features/plans/lib/days-until.ts` を実装し T007 をパスさせる（`daysUntil(plannedOn: string, today: string): number` の純粋関数）
- [x] T009 [P] `service-front/src/features/plans/lib/default-packing-items.ts` を作成（12 項目定数: マスク / シュノーケル / フィン / ブーツ / ウェットスーツ / レギュレーター / BCD / ダイブコンピューター / ログブック / Cカード / タオル / 日焼け止め）+ 同階層に単体テスト（件数・name 60 字以内・position 連番）
- [x] T010 `service-front/src/features/plans/types.ts` に `Plan` / `PlanListItem` / `PackingItem` / `NextPlanSummary`（残り日数・進捗付き）を定義（`Database['public']['Tables'][...]['Row']` 生成型ベース、手書き row 型禁止 — arch/feature-based.md）

**Checkpoint**: スキーマ・lib のテストが全てグリーン — User Story 実装を開始できる

---

## Phase 3: User Story 1 - ダイビング予定を登録して管理する (Priority: P1) 🎯 MVP

**Goal**: 予定の一覧 / 作成 / 編集 / 削除が `/plans` 配下で完結する

**Independent Test**: ログイン → `/plans` で予定を作成 → 一覧表示（未来 / 終了済み区分）→ 編集 → 削除が動作し、必須欠落時はフィールドエラーが出る

- [x] T011 [US1] `service-front/src/features/plans/server/queries.ts` に `listPlans()`（自分の予定を `planned_on` 昇順全件、Supabase エラーは throw）と `getPlan(id)`（データなしは null）を実装（FR-001 / FR-005 のデータ源）
- [x] T012 [US1] `service-front/src/features/plans/server/actions.ts` に `createPlan` / `updatePlan` / `deletePlan` を実装（`ActionResult<T>` + `actionSuccess` / `actionFailure`、`auth.getUser()` 必須、`user_id` はサーバー側で設定、`revalidatePath('/plans')`）
- [x] T013 [P] [US1] `service-front/src/features/plans/components/client/PlanForm/` を作成（新規・編集共有。`@/shared/components/form` の FormField / FormTextarea 使用、ActionResult ハンドリング）+ PlanForm.test.tsx + PlanForm.stories.tsx + index.ts
- [x] T014 [P] [US1] `service-front/src/features/plans/components/client/PlanList/` を作成（未来 / 終了済みの区分表示・`daysUntil` による「あと N 日」表示・0 件時の「次のダイビングを計画しよう」CTA）+ test + story + index.ts
- [x] T015 [P] [US1] `service-front/src/features/plans/components/client/DeletePlanButton/` を作成（確認ダイアログ + `deletePlan`。既存 DeleteDiveButton の実装パターン踏襲）+ test + story + index.ts
- [x] T016 [US1] `service-front/src/app/(authenticated)/plans/page.tsx` を作成（`listPlans` → PlanList。`generatePageMetadata` / Header / Footer / Breadcrumbs）
- [x] T017 [P] [US1] `service-front/src/app/(authenticated)/plans/new/page.tsx` を作成（PlanForm 新規モード）
- [x] T018 [P] [US1] `service-front/src/app/(authenticated)/plans/[id]/edit/page.tsx` を作成（`getPlan` → null なら `notFound()`、PlanForm 編集モード）
- [x] T019 [US1] `service-front/src/app/(authenticated)/plans/[id]/page.tsx` を作成（予定詳細: 日付・ポイント・メモ・残り日数 / 終了済み表示 + 編集・削除導線。持ち物リスト区画は US3 で追加）
- [x] T020 [US1] `service-front/src/features/plans/index.ts` に公開 API（PlanForm / PlanList / DeletePlanButton / listPlans / getPlan / 型）を整備

**Checkpoint**: US1 単独で予定管理として成立（MVP リリース可能）

---

## Phase 4: User Story 2 - TOP で「次の予定」を確認する (Priority: P2)

**Goal**: TOP に次の予定カード（残り日数 + 持ち物進捗）が出る

**Independent Test**: 未来予定ありで `/` に予定カード（日付・ポイント・あと N 日）、予定なしで計画 CTA が表示される

- [x] T021 [US2] `service-front/src/features/plans/server/queries.ts` に `getNextPlanWithProgress()` を実装（`planned_on >= JST 今日` の最近接 1 件、同日複数は `created_at` 降順優先、持ち物の checked / total を集計 — research.md Decision 6。予定なしは null）
- [x] T022 [P] [US2] `service-front/src/features/plans/components/server/NextPlanCard/` を作成（Server Component。予定あり / なし（CTA）/ 今日 / 準備完了の表示分岐、色だけに依存しないバッジ）+ NextPlanCard.stories.tsx + index.ts（Server Component のため単体テストは story ベース）
- [x] T023 [US2] `service-front/src/app/page.tsx`（現行 TOP）に NextPlanCard セクションを追加（FR-006。現行 `/` は公開ルートのため `auth.getUser()` で分岐し**未認証時はセクションごと非表示**にする。003-dashboard 実装時はそのセクション構成へ移設する旨をコメントで明記）

**Checkpoint**: TOP が「次の予定」のハブとして機能

---

## Phase 5: User Story 3 - 予定ごとの持ち物リストで準備する (Priority: P3)

**Goal**: デフォルト持ち物の自動展開 + チェック / 追加 / 削除

**Independent Test**: 予定を新規作成 → 詳細にデフォルト 12 項目が未チェックで並ぶ → チェック / カスタム追加 / 削除が永続化される

- [x] T024 [US3] `createPlan`（`service-front/src/features/plans/server/actions.ts`）にデフォルト持ち物の一括 insert を追加（`default-packing-items` を position 連番で展開。items insert 失敗時は作成した予定を削除して `actionFailure` を返す = 中途半端な状態を残さない）+ 関連テスト更新（FR-011）
- [x] T025 [US3] `getPlan` を持ち物込みに拡張（`plan_packing_items` を `position` 昇順で取得し `PlanWithPacking` を返す）
- [x] T026 [US3] `service-front/src/features/plans/server/actions.ts` に `togglePackingItem` / `addPackingItem`（position は末尾採番）/ `deletePackingItem` を実装（`ActionResult`、FR-012〜013）
- [x] T027 [P] [US3] `service-front/src/features/plans/components/client/PackingList/` を作成（`<ul>` + native checkbox + label、`useTransition` + `router.refresh()`、進捗テキスト「N / M 準備済み」を `aria-live="polite"` で更新、全件チェックで「準備完了」表示、カスタム項目追加フォーム + 項目削除）+ test + story + index.ts
- [x] T028 [US3] `service-front/src/app/(authenticated)/plans/[id]/page.tsx` に PackingList 区画を組み込み（T019 のページを拡張）

**Checkpoint**: 全 User Story 完了 — spec の受け入れシナリオを満たす

---

## Phase 6: Polish & Cross-Cutting Concerns

- [x] T029 [P] Playwright a11y テストを追加（`service-front/tests/a11y/` に `/plans` / `/plans/new` / `/plans/[id]` の WCAG 2.1 AA 検証。認証が必要なため既存のテストユーザーログインのセットアップを整備）
- [x] T030 [P] 画面仕様を作成: `specs/004-top-dive-plans/screens/{plan-list,plan-form,plan-detail}.md`（実装に合わせた項目定義・状態・遷移。`_template` は 002 の screens を参照モデルに）
- [x] T031 `npx supabase db lint` を実行し `auth_rls_initplan` / `function_search_path_mutable` 警告 0 を確認（出た場合は data-model.md ごと修正）
- [x] T032 [quickstart.md](quickstart.md) の全シナリオを手動検証し、`checklists/requirements.md` と spec の受け入れ条件に照らして最終確認（`npx tsc --noEmit` / `npx biome check service-front/src/features/plans` / `npx vitest run --project unit src/features/plans` 全パスを含む）

---

## Dependencies

```text
Phase 1 (Setup) ─→ Phase 2 (Foundational) ─→ US1 (P1) ─→ US2 (P2) ─→ US3 (P3) ─→ Polish
                                                  │            │
                                                  │            └─ T021 は T011 のファイルに追記（順次）
                                                  └─ US2 / US3 は US1 の queries/actions/詳細ページを拡張するため US1 完了後に着手
```

- **T001 → T002 → 残り全部**: 生成型が無いと types.ts（T010）以降が書けない
- **T005 → T006、T007 → T008**: テスト先行ペア
- **US2 と US3 は並列可能**（T021/T024〜T026 が同一ファイル `queries.ts` / `actions.ts` を触る点だけ調整が必要。別開発者 / 別エージェントで進める場合は US2 を先に完了させるのが安全）
- **T023（TOP 統合）は 003-dashboard と独立**: 003 実装後に NextPlanCard をダッシュボードのセクションへ移設する（コメントで明示）

## Parallel Execution Examples

- **Phase 2**: T005 / T007 / T009 を並列起票 → それぞれの実装（T006 / T008）を続ける
- **US1**: T011〜T012 完了後、T013 / T014 / T015（コンポーネント 3 つ）と T017 / T018（ページ 2 つ）は並列可能
- **Polish**: T029 / T030 は並列可能

## Implementation Strategy

1. **MVP = Phase 1 + 2 + US1（T001〜T020）**: 予定管理単体でリリース可能な増分
2. 次に US2（TOP カード）で日常導線を作り、US3（持ち物）で「準備のためのアプリ」として完成させる
3. 各 Checkpoint で `npx vitest run --project unit src/features/plans` と該当画面の手動確認を行ってから次 Phase へ進む
