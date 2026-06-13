---

description: "Task list for blank days display implementation"
---

# Tasks: ブランク日数の表示

**Input**: Design documents from `/specs/009-blank-days/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Constitution III（Test-First）に従い、算出ロジックはテストを先に書く。新規コンポーネント `BlankDays` は `/generate-with-tests` で Vitest 単体テスト・Storybook story を同梱する。

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)

## 前提

- 既存の認証機能（001）とダイブログ機能（002-dive-log-crud）が利用できること
- **マイグレーション・依存パッケージ追加・新規画面は本機能では一切不要**（Setup フェーズなし。変更は `features/dashboard` 内で完結）
- worktree 内のため、テスト実行は `make front-*` ではなく `service-front` で `npx` を直接使う（[quickstart.md](quickstart.md)）

---

## Phase 1: Foundational (算出ロジック)

**Purpose**: 表示の前提となるブランク日数算出の純粋関数（[research.md R1](research.md) / [data-model.md](data-model.md) 参照）

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 `service-front/src/features/dashboard/lib/blankDays.test.ts` を作成（45 日前 → 45、当日 → 0、未来日 → 0 に丸め（FR-003）、`lastDiveOn === null` → null、月またぎ・年またぎの暦日差、同一入力 → 同一出力。テストを先に書き、この時点では fail する）
- [X] T002 `service-front/src/features/dashboard/lib/blankDays.ts` を実装（`calcBlankDays(lastDiveOn: string | null, today: string): number | null`。既存 `@/shared/lib/date` の `daysUntil` を符号反転し `Math.max(0, ...)` で下限 0 に丸める。null は null を返す。T001 をグリーンにする）

**Checkpoint**: 算出ロジック確立 - user story implementation can now begin

---

## Phase 2: User Story 1 - TOP でブランク日数を一目で確認する (Priority: P1) 🎯 MVP

**Goal**: TOP ヒーローの「前回のダイブから ○ 日」を、ショップ申告にそのまま使える明示的な「最後に潜ってから ○日」の数値強調表示に置き換える。ログ 0 件では既存の記録案内を維持する。

**Independent Test**: 最後のダイブログの日付が 45 日前のユーザーで TOP を開き、「45日」が一目でわかる形で表示されること（[quickstart.md シナリオ 1](quickstart.md)）。

### Implementation for User Story 1

- [X] T003 [P] [US1] `service-front/src/features/dashboard/components/server/BlankDays/` を新規作成（`BlankDays.tsx`: Props `{ blankDays: number }` の表示専用 Server Component。「最後に潜ってから」ラベル + 強調数値 + 「日」を 1 つの段落として読み上げられる構造で表示し、`blankDays === 0` のとき「今日もダイビング日和！」を併記（[research.md R4](research.md)）。`index.ts` で再 export。コントラストは既存トークンのみ使用）
- [X] T004 [US1] `/generate-with-tests /Users/hercules1177/Documents/github/claude-settings/.claude/worktrees/009-blank-days/service-front/src/features/dashboard/components/server/BlankDays/BlankDays.tsx` を実行し、`BlankDays.test.tsx`（45日・0日の表示、0日時の併記文言）/ `BlankDays.stories.tsx`（通常・0日 の story）を生成する（コンポーネントフォルダ規約の同梱要件）
- [X] T005 [P] [US1] `service-front/src/features/dashboard/types.ts` の `DashboardHero.daysSinceLastDive` を `blankDays` に改名し（[research.md R3](research.md)）、`service-front/src/features/dashboard/server/queries.ts` の `getDashboardHero` のインライン計算 `-daysUntil(...)` を `calcBlankDays(lastDiveOn, todayInJst())` に置き換える（未来日ログで負になる潜在バグの解消。改名とセットで同一タスクとしコンパイル断絶を避ける）
- [X] T006 [US1] `service-front/src/features/dashboard/components/server/TopDashboard/TopDashboard.tsx` のヒーロー文言を置き換える（`hero.blankDays === null` → 既存の「まだダイブログがありません」案内を維持（FR-004）、それ以外 → `<BlankDays blankDays={hero.blankDays} />`）。同階層の `TopDashboard.test.tsx`（45日表示・0日表示・ログ 0 件の案内維持のアサート）を新規作成（既存 test / story は存在しなかったため同期ではなく queries モックで新設。story はデータフェッチを持つ async Server Component のため既存方針どおり作成せず、新規 UI は BlankDays.stories.tsx でカバー）

**Checkpoint**: TOP を開くだけでブランク日数が確認でき、US1 単独でリリース可能

---

## Phase 3: Polish & Cross-Cutting Concerns

- [X] T007 [P] `cd service-front && npx playwright test tests/a11y` で TOP を含む既存画面の axe-core 違反 0 件を確認（ブランク日数が一続きの文として読み上げられること。Constitution V）
- [X] T008 [P] [quickstart.md](quickstart.md) の手動検証シナリオ 1〜2 を実施（45 日前ログ → 「45日」、最新ログ追加で更新（FR-006）、当日ログ → 「0日」、全削除 → 案内に戻る、未来日ログ → 「0日」）
- [X] T009 `cd service-front && npx tsc --noEmit && npx vitest run --project unit src/features/dashboard && npx vitest run --project storybook src/features/dashboard` で型チェック・テストの全チェックをグリーンにする

---

## Dependencies

```text
Phase 1 (T001 → T002)  ※ テスト先行のため直列
   ↓
Phase 2: US1
   T003 BlankDays 作成 ─→ T004 test/story 生成 ─┐
   T005 types 改名 + queries 置き換え ──────────┴→ T006 TopDashboard 統合
   （T003 と T005 は別ファイルのため並列可）
   ↓
Phase 3: Polish (T007 / T008 並列 → T009)
```

- T005 の改名（types.ts）と queries.ts の置き換えは同一タスク内で行い、改名だけが先行してコンパイルが壊れる中間状態を作らない
- T006 は BlankDays（T003）と `hero.blankDays`（T005）の両方に依存するため最後に統合する

## Parallel Execution Examples

```text
Phase 1:  T001 blankDays.test.ts → T002 blankDays.ts（直列。fail を確認してから実装）

Phase 2:  T003 BlankDays 作成 → T004 /generate-with-tests ─┬─ 並列
          T005 types.ts + queries.ts ──────────────────────┘ → T006 TopDashboard（最後）

Phase 3:  T007 a11y ─┬─ 並列
          T008 手動検証 ─┘ → T009 型チェック + 全テスト（最後）
```

## Implementation Strategy

1. **MVP first**: 本機能はユーザーストーリーが 1 つ（US1 = MVP）。Phase 1〜2（T001〜T006）の完了でリリース可能な状態になる
2. **Test-First**: T001 は T002 より必ず先に着手し、fail を確認してから実装する。T003 のコンポーネントは T004 で test / story を必ず同梱する（Constitution III）
3. **既存バグの解消**: T005 の置き換えにより、未来日ログでブランク日数が負になる既存の潜在バグが解消される（FR-003。T001 の未来日ケースが回帰テストを兼ねる）
4. コミット前に `/review` と `/sync-spec` を実施する（Constitution: Development Workflow）
