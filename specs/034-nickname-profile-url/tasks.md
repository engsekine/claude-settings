# Tasks: プロフィール URL のニックネーム化

**Input**: Design documents from `/specs/034-nickname-profile-url/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/routes-and-resolution.md, quickstart.md

**Tests**: Constitution III（Test-First）に従い、profile-path ヘルパー・schema 制約・解決 query は Vitest を先に書く。E2E は Playwright（`tests/profile-url.spec.ts` 新設）。

**Organization**: ユーザーストーリー単位（US1: ニックネーム URL = MVP、US2: ID 互換転送、US3: 変更フロー）。

## Format: `[ID] [P?] [Story] Description`

- **[P]**: 並列実行可（別ファイル・未完了タスクへの依存なし）
- **[Story]**: US1 / US2 / US3（ユーザーストーリーフェーズのみ）

---

## Phase 1: Setup

**Purpose**: ニックネーム解決 RPC の追加

- [X] T001 マイグレーション作成: `supabase/migrations/<ts>_create_get_user_id_by_nickname_fn.sql` に `get_user_id_by_nickname(p_nickname text) returns uuid`（`stable` / `security definer` / `set search_path = ''` / `lower(trim())` 照合 / grant authenticated のみ）を定義し、ローカル DB に適用する（data-model.md の SQL 全文参照）

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 判定・生成・解決・制約の共通基盤。全ストーリーがここに依存する

**⚠️ CRITICAL**: このフェーズ完了までユーザーストーリーの実装に着手しない

- [X] T002 `service-front/src/shared/lib/profile-path/` を **テスト先行**で作成（`profile-path.ts` + `profile-path.test.ts` + `index.ts`）: `RESERVED_USER_SEGMENTS = ['search']`・禁止文字（`/ ? # % \` + 制御文字）・`isUuid` / `isUrlSafeNickname` / `profilePath({ userId, nickname })` を実装する。テスト観点: 日本語・スペースは safe（encodeURIComponent される）、禁止文字・予約語（大文字小文字問わず）・uuid 形式・空/null nickname は ID フォールバック（contracts の profilePath 契約参照）
- [X] T003 `service-front/src/shared/schemas/user-profile.ts` の nickname に **テスト先行**で追加制約を実装: 禁止文字・uuid 形式・予約語を拒否（エラーメッセージは contracts の表に従う。判定は profile-path モジュールの定数・関数を再利用し二重管理しない）。既存の schema テスト（signup / profile-completion / account profile）に拒否ケースを追記して同期する（FR-006）
- [X] T004 `service-front/src/features/social/server/queries.ts` に `resolveUserIdByNickname(nickname: string): Promise<string | null>`（RPC `get_user_id_by_nickname` 呼び出し）を **テスト先行**で追加する（T001 に依存）

**Checkpoint**: 判定・生成・解決・制約が揃い、ルート実装を開始できる

---

## Phase 3: User Story 1 - プロフィール URL がニックネームになる (Priority: P1) 🎯 MVP

**Goal**: `/users/<ニックネーム>` でプロフィールが表示され、アプリ内の全導線がニックネーム URL を生成する

**Independent Test**: quickstart.md シナリオ 1（マイプロフィール・各導線・followers/following・404・大文字小文字解決）

- [X] T005 [US1] ルートを `service-front/src/app/(authenticated)/users/[id]/` から `users/[slug]/` へ git mv し、`page.tsx` を「`decodeURIComponent(slug)` → uuid でなければ `resolveUserIdByNickname` で user_id 解決 → 既存表示ロジックへ合流。解決不可は `notFound()`」に変更する（uuid 分岐の転送は T012 = US2。この時点では uuid はそのまま既存動作で表示してよい）。`generatePageMetadata` の slug はニックネーム URL を正とする
- [X] T006 [US1] `users/[slug]/followers/page.tsx`・`following/page.tsx` に同じ判別・解決を適用し、Breadcrumbs のプロフィールリンクを profilePath 化する。T005 に依存
- [X] T007 [P] [US1] social 系のリンク生成を profilePath 化: `Timeline`・`FollowList`・`FollowCounts`・ユーザー検索結果（nickname は表示用に取得済み）。各コンポーネントの test / stories を同期更新する
- [X] T008 [P] [US1] dives / notifications のリンク生成を profilePath 化: `DiveDetail`（バディ。buddy.name = nickname）・`notificationTarget`（followed の遷移先。通知一覧の actor nickname を利用し、シグネチャ変更があれば呼び出し元と test を同期）
- [X] T009 [P] [US1] `AuthNav` のマイプロフィールリンクを `profilePath({ userId: user.id, nickname: user.user_metadata?.['nickname'] })` に変更し、test / stories を同期更新する（metadata に nickname が無い場合は ID URL になることをテストで固定。research.md Decision 4）
- [X] T010 [US1] Playwright E2E `service-front/tests/profile-url.spec.ts` を新規作成: ニックネーム URL での表示・ヘッダー/タイムライン/フォロー一覧導線・followers/following・存在しないニックネームの 404・大文字小文字違いの解決（quickstart シナリオ 1。seed の test / buddy ユーザーを使用）

**Checkpoint**: ニックネーム URL が全導線で機能する（MVP）

---

## Phase 4: User Story 2 - 既存の ID 形式 URL の互換維持 (Priority: P2)

**Goal**: ID 形式 URL がニックネーム URL へ恒久転送され、既存リンクが壊れない

**Independent Test**: quickstart.md シナリオ 2（uuid アクセス → 転送・下層パス維持・不在 uuid の 404）

- [X] T011 [US2] `users/[slug]/page.tsx` の uuid 分岐を実装: `get_user_public_profiles` で nickname を取得し、URL 安全なら `redirect(profilePath(...))`、URL 不可ニックネームは転送せず ID のまま表示（FR-005）、不在は `notFound()`。followers / following も下層パスを維持して転送する（contracts のルート表参照）
- [X] T012 [P] [US2] `service-front/src/features/social/server/actions.ts` の `revalidatePath('/users/${followeeId}')` をニックネーム URL と ID URL の両方の revalidate に変更する（フォロー操作後のキャッシュ整合。actions テストがあれば同期）
- [X] T013 [US2] E2E 追記（`tests/profile-url.spec.ts`）: uuid URL → ニックネーム URL への転送（本体・followers）・存在しない uuid の 404（quickstart シナリオ 2）

**Checkpoint**: US1 + US2 で新旧 URL が共存する

---

## Phase 5: User Story 3 - ニックネーム変更と URL の関係 (Priority: P3)

**Goal**: 変更が URL に即時反映され、旧ニックネーム URL は無効・ID URL は追随する

**Independent Test**: quickstart.md シナリオ 3（変更 → 新 URL・旧 URL 404・ID URL 追随）+ シナリオ 4 の登録拒否

- [X] T014 [US3] `service-front/src/features/account/server/actions.ts` の `updateProfile` に、nickname 変更成功時の `auth.updateUser({ data: { nickname } })` 同期を **テスト先行**で追加する（同期失敗は成功扱い + console.error。research.md Decision 4 / contracts 参照）
- [X] T015 [US3] E2E 追記（`tests/profile-url.spec.ts`）: ニックネーム変更 → マイプロフィール URL が新ニックネームになる → 旧ニックネーム URL は 404 → ID URL は新 URL へ転送 → 変更を元に戻す（後始末）。あわせて設定画面で `search` / uuid 形式 / `a/b` への変更が拒否されることを確認する（quickstart シナリオ 3・4）

**Checkpoint**: 全ストーリーが独立して機能する

---

## Phase 6: Polish & Cross-Cutting Concerns

- [X] T016 [P] 全体検証: `npx tsc --noEmit`・`npx biome check`（変更ファイル）・`npx vitest run --project unit`（cwd は `service-front`）・`npx playwright test tests/profile-url.spec.ts` + 既存の social 系 E2E / a11y スイープ（`tests/social-flows.spec.ts`・`tests/a11y/social-pages.spec.ts`）の回帰確認をすべて green にする
- [X] T017 [P] quickstart.md のシナリオ 1〜5 を手動検証する
- [X] T018 既存仕様書の同期: `/sync-spec` で 021（/users/[id] 記述）・025（通知の遷移先）・027（プロフィール導線）等のニックネーム URL への追随と、034 の spec / contracts と実装のずれを確認・修正する

---

## 実装メモ（034 実装セッション / 2026-07-12）

T001〜T018 全タスク完了。稼働中のローカル Supabase を再利用し、単体・E2E・回帰まで検証済み。

**完了した検証（すべて green）**
- `npx tsc --noEmit`: エラー 0 / `npx biome check .`: エラー 0（残 4 warning は既存コミット由来の useSortedClasses）
- `npx vitest run --project unit`: 1413 passed（profile-path 25・slug 解決・schema 禁則・metadata 同期含む）
- `npx playwright test tests/profile-url.spec.ts`: **9 passed**（ニックネーム表示・ヘッダー導線・followers/following・大文字小文字解決・404・uuid 転送（下層含む）・ニックネーム変更フロー・禁則拒否）
- 回帰: `tests/social-flows.spec.ts` + `tests/a11y/social-pages.spec.ts` **5 passed**（プロフィール画面の axe AA 含む）

**quickstart との対応**: シナリオ 1〜5 は E2E で自動検証済み。シナリオ 4 の「既存の URL 不可ニックネームのユーザー」はローカル DB に該当データが無いため、profilePath / resolveProfileSlug の単体テスト（ID フォールバック分岐）で代替した。

**セッション中の判断・逸脱（仕様書へ同期済み）**
- `revalidatePath` は「ニックネーム/ID の 2 パス個別」ではなく `revalidatePath('/users/[slug]', 'page')` の動的ルート全体再検証に変更（contracts 更新済み。個別方式は follow 時に相手ニックネームの追加取得が必要になるため）
- 生成型 `packages/supabase/src/types.ts` は再生成せず、コミット済みの型に RPC `get_user_id_by_nickname` のエントリのみ手追加（稼働 DB には未コミットの 033 スキーマが含まれ、再生成するとこのブランチのコードが壊れるため）
- 既存仕様の同期: 021（plan/quickstart のプロフィール URL 記述）・025（followed の遷移先）を 034 準拠に更新

**worktree の注意**: 033 と同じ構成（node_modules は個別 symlink + `@repo` のみ実体・`.env` は symlink）。マイグレーションは docker 内 psql で稼働 DB に適用済み（`supabase migration up` は CLI の config 不整合で不可）。

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 依存なし
- **Phase 2 (Foundational)**: T002 / T003 は並列可（T003 は T002 の定数を使うため T002 完了後が安全）。T004 は T001 完了後。**T002〜T004 が全ストーリーをブロック**
- **Phase 3 (US1)**: Phase 2 完了後。T005 → T006、T007 / T008 / T009 は並列可 → T010
- **Phase 4 (US2)**: T005 完了後（同一ファイルの uuid 分岐）。T012 は独立して並列可
- **Phase 5 (US3)**: Phase 2 完了後いつでも可（T014 は独立）。T015 は T005・T011 完了後
- **Phase 6 (Polish)**: 全ストーリー完了後

### Parallel Opportunities

- T007 / T008 / T009（別 feature のリンク置き換え）
- T012（revalidatePath）は Phase 3 と並行可
- T016 / T017（検証系）

### Parallel Example: User Story 1

```bash
# リンク生成の置き換えを feature ごとに同時着手:
Task: "social 系（Timeline / FollowList / FollowCounts / 検索結果）を profilePath 化"
Task: "dives（DiveDetail バディ）と notifications（notificationTarget）を profilePath 化"
Task: "AuthNav のマイプロフィールリンクを profilePath 化"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 → Phase 2（RPC + profile-path + schema 制約 + 解決 query）
2. Phase 3（US1: [slug] 化 + 全導線 + E2E）
3. **STOP and VALIDATE**: quickstart シナリオ 1 で単独検証

### Incremental Delivery

1. + Phase 4（US2: ID 互換転送）→ シナリオ 2 検証
2. + Phase 5（US3: 変更フロー + metadata 同期）→ シナリオ 3・4 検証
3. Phase 6 で回帰・手動検証・既存仕様書の同期

---

## Notes

- **US1 完了までの中間状態**では uuid URL が従来どおり表示される（T011 で転送に変わる）ため、段階デリバリーでもリンク切れは発生しない
- 判定規則（禁止文字・予約語・uuid）は profile-path モジュールが唯一の情報源。schema・ページ判別・リンク生成すべてがこれを参照する（規則の二重管理禁止）
- lib は専用フォルダ（本体 + `.test.ts` + `index.ts`）、コンポーネント編集時は同階層の test / stories を必ず同期する（`rules/folder-structure.md` / CLAUDE.md）
- 033 の実装が同一ワークツリーに未コミットで載っている。**034 の実装着手前に 033 をコミット（またはブランチ分離）すること**
