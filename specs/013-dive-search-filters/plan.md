# Implementation Plan: ダイブログ検索・フィルタ強化

**Branch**: `013-dive-search-filters` | **Date**: 2026-06-18 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/013-dive-search-filters/spec.md`

## Summary

ダイブログ一覧の検索を、現状の「番号 / 単一日付 / ポイント名」から **期間（開始日〜終了日）・深度範囲（最大水深の下限〜上限）・ダイブタイプ** の 3 軸を加えた複合フィルタへ拡張する。追加フィルタは折りたたみ式「詳細条件」パネルに格納し（FR-012）、既存の番号・ポイント名は常時表示を維持する。すべてのフィルタは AND で組み合わさり、不正範囲は検索を実行せず入力エラーを示す。あわせて、これまで `useState` のみで保持していたフィルタ状態を **URL クエリパラメータに同期** し、再読み込み・共有で結果を復元できるようにする（FR-010 / SC-004）。スキーマ変更は不要（既存カラムでの絞り込みのみ）。

技術アプローチ: 既存の `diveSearchSchema`（yup）・`DiveListFilter`（型）・`fetchDiveListPage`（クエリ）・`DiveSearchBar`（UI）・`useDives`（react-query infinite）・`DiveList`（一覧）を拡張し、新規に URL ⇔ フィルタ変換ユーティリティを 1 つ追加する。

## Technical Context

**Language/Version**: TypeScript（strict）/ Next.js App Router（React Compiler 有効）

**Primary Dependencies**: React Hook Form + yup（検索フォーム）、@tanstack/react-query（infinite query）、Supabase JS（クエリ）、Tailwind CSS

**Storage**: Supabase（PostgreSQL）。本機能は **スキーマ変更なし**。既存 `dives` テーブルの `dive_date` / `max_depth_m` / `dive_type` カラムで絞り込む

**Testing**: Vitest（単体）、Storybook、Playwright + axe-core（a11y）

**Target Platform**: Web（認証済みエリア `/dives`）

**Project Type**: Web application（service-front 単一 Next.js アプリ + Supabase）

**Performance Goals**: 既存一覧と同等。キーセットページネーション（`(dive_date, id)` 複合カーソル）を維持し、フィルタは DB 側で適用する

**Constraints**: 本人のログのみ（既存 RLS）。フィルタ状態は URL クエリで表現し共有可能。WCAG 2.1 AA

**Scale/Scope**: 1 ユーザー数百〜数千本規模のログを想定。変更は `dives` feature 内に限定（+ 一覧ページの searchParams 受け取り）

## Constitution Check

*GATE: Phase 0 前に通過必須。Phase 1 後に再評価。*

| 原則 | 判定 | 根拠 |
|---|---|---|
| I. Spec-Driven Development | PASS | spec.md（clarify 済み）→ 本 plan → tasks の順で進行 |
| II. Server Components First | PASS | 一覧ページ（`dives/page.tsx`）は Server Component のまま `searchParams` を受けて SSR フェッチ。インタラクション（フォーム・URL 更新・追加読み込み）は既存の Client Component `DiveList` / `DiveSearchBar` の最小範囲に限定 |
| III. Test-First | PASS | 変更する schema / query / util / コンポーネントに Vitest を先に追加・更新。`DiveSearchBar` は story と a11y（`dives-pages.spec.ts`）も同梱・更新 |
| IV. Security & RLS by Default | PASS | スキーマ変更・マイグレーションなし。絞り込みは既存の本人限定 RLS 下のクエリに条件を追加するのみ。`or()` 用キーワードは既存同様サニタイズ済み（本機能の新規フィルタは値・列挙・日付で `eq`/`gte`/`lte` のみ＝インジェクション面なし） |
| V. Accessibility（WCAG 2.1 AA） | PASS | 「詳細条件」は disclosure パターン（`aria-expanded` / `aria-controls`）、各入力は `label` 関連付け、範囲エラーは `role="alert"` + `aria-invalid`、適用中フィルタ件数はテキストで提示 |
| VI. Coding Standards | PASS | TS strict・`any` 禁止、Feature-based 構成、Tailwind utility-first、命名規約に準拠。ダイブタイプ選択肢は既存 `DIVE_TYPE_OPTIONS` を流用 |

**違反なし** → Complexity Tracking なし。

## Project Structure

### Documentation (this feature)

```text
specs/013-dive-search-filters/
├── plan.md              # 本ファイル
├── spec.md              # 要件（clarify 済み）
├── research.md          # Phase 0 出力
├── data-model.md        # Phase 1 出力（フィルタモデル・既存カラムの参照）
├── quickstart.md        # Phase 1 出力（検証手順）
├── contracts/
│   └── search-params.md # URL クエリパラメータ契約 + クエリ意味論
├── checklists/
│   └── requirements.md  # spec 品質チェックリスト
└── tasks.md             # /speckit-tasks で生成（本コマンドでは作らない）
```

### Source Code (repository root: `service-front/`)

変更・追加は `src/features/dives/` に集約し、一覧ページのみ `searchParams` 受け取りを追加する。

```text
src/features/dives/
├── schemas/dive.schema.ts           # [変更] diveSearchSchema に期間/深度/ダイブタイプ + 範囲バリデーション
├── types.ts                         # [変更] DiveListFilter に dateFrom/dateTo/depthMin/depthMax/diveType
├── lib/
│   ├── list-query.ts                # [変更] fetchDiveListPage に範囲・タイプ・深度null除外を追加
│   └── search-params.ts             # [新規] URL(URLSearchParams) ⇔ DiveListFilter 変換 + 等価判定
├── hooks/useDives.ts                # [変更] isEmptyFilter を全フィルタ対応に一般化
└── components/client/
    ├── DiveSearchBar/DiveSearchBar.tsx  # [変更] 折りたたみ詳細パネル + 適用中表示 + 範囲エラー
    └── DiveList/DiveList.tsx            # [変更] URL 同期・initialFilter・0件解除導線

src/app/(authenticated)/dives/page.tsx    # [変更] searchParams → 初期フィルタで SSR、DiveList へ initialFilter
tests/a11y/dives-pages.spec.ts            # [変更] 詳細パネル展開時の a11y を追加
```

**Structure Decision**: 既存の Feature-based 構成（`src/features/dives`）を踏襲。新規ファイルは URL 変換ユーティリティ 1 本のみ。コンポーネントは既存 2 つ（`DiveSearchBar` / `DiveList`）を拡張し、それぞれ同階層の `*.test.tsx` / `*.stories.tsx` を同期更新する（CLAUDE.md のテスト同期ルール）。

## Design Detail

### 1. フィルタモデルの拡張

`DiveListFilter`（`types.ts`）に追加し、単一 `diveDate` は期間に置換する（spec Assumptions）:

```ts
export interface DiveListFilter {
    diveNumber?: number;
    dateFrom?: string;   // YYYY-MM-DD（旧 diveDate を置換）
    dateTo?: string;     // YYYY-MM-DD
    depthMin?: number;   // m（最大水深の下限）
    depthMax?: number;   // m（最大水深の上限）
    diveType?: string;   // DIVE_TYPE_OPTIONS の value
    location?: string;
}
```

### 2. バリデーション（`diveSearchSchema`）

- `dateFrom` / `dateTo`: 既存 `diveDate` と同じ日付形式。`dateTo >= dateFrom`（yup `.test` で相互参照、片側のみは許容）
- `depthMin` / `depthMax`: 0〜300 の数値（既存 `maxDepthM` のデータドメインに合わせる）。`depthMax >= depthMin`
- `diveType`: `DIVE_TYPE_OPTIONS` の value のいずれか or null（`oneOf`）
- エラーは FR-006: 不正範囲なら submit を通さずフィールドエラーを表示（既存の `errors` 表示機構を流用）

### 3. クエリ（`fetchDiveListPage`）

既存の `eq`/`or` に AND で条件を追加（順序は等価→範囲）:

```text
diveNumber  → .eq('dive_number', n)
diveType    → .eq('dive_type', t)
dateFrom    → .gte('dive_date', dateFrom)
dateTo      → .lte('dive_date', dateTo)
depthMin/Max が片方でもある → .not('max_depth_m', 'is', null)   // FR-002: null 除外（Q1 確定）
depthMin    → .gte('max_depth_m', depthMin)
depthMax    → .lte('max_depth_m', depthMax)
location    → 既存 OR（自由入力名 + サイト名）を維持
cursor      → 既存キーセット OR を維持
```

範囲・タイプは `.gte`/`.lte`/`.eq` で AND 合流するため、既存の location/cursor の `.or()` と共存して問題ない。

### 4. URL 同期（新規・FR-010 / SC-004）

`lib/search-params.ts` に純粋関数を実装:

- `parseDiveFilter(params: URLSearchParams): DiveListFilter` — URL → フィルタ（数値・日付の検証込み。不正値は無視）。Server の `searchParams`（Record）は `recordToSearchParams` で `URLSearchParams` に変換してから渡す
- `filterToSearchParams(filter: DiveListFilter): URLSearchParams` — フィルタ → URL（空値は省略）
- `isSameFilter(a, b): boolean` — initialData シードと URL 更新の冪等判定に使用

結線:

- `dives/page.tsx`（Server）: `searchParams` を受け取り `parseDiveFilter` → `listDives({ filter })` で SSR、`DiveList` に `initialPage` と `initialFilter` を渡す
- `DiveList`（Client）: `useState` の初期値を `initialFilter` に。`onSubmit`/クリア時に `filterToSearchParams` で `router.replace('/dives?...')`（スクロール維持）し、`useDives` のキーも更新。`useDives` の initialData シードは「現在フィルタ == initialFilter」のとき有効化（`isSameFilter`）

### 5. UI（`DiveSearchBar`）— 折りたたみ詳細パネル（FR-012）

- 常時表示: ダイブ番号・ポイント名（現状維持）
- disclosure ボタン「詳細条件」: `aria-expanded` / `aria-controls`。展開領域に 期間（開始日 / 終了日 type=date）・深度（下限 / 上限 type=number）・ダイブタイプ（native `select` + `DIVE_TYPE_OPTIONS`、先頭に「指定しない」）
- 折りたたみ時も適用中が分かるよう、ボタン近傍に「詳細条件: N 件適用中」テキストを表示（FR-012）
- 検索 / クリア（一括解除 = FR-011）は現状の Button を流用

### 6. 0 件時の解除導線（FR-008 / SC-005）

`DiveList` の「検索条件に一致するログはありません」ブロックに、フィルタ解除アクション（クリアと同じ挙動 = 空フィルタ + URL クリア）を追加する。

## Phase 0: Research

→ [research.md](./research.md)（NEEDS CLARIFICATION なし。URL 同期方式・Supabase 範囲/NULL クエリ・disclosure a11y の採用根拠を記載）

## Phase 1: Design & Contracts

- [data-model.md](./data-model.md): フィルタ（導出状態）モデルと参照する既存カラム。スキーマ変更なしを明記
- [contracts/search-params.md](./contracts/search-params.md): `/dives` の URL クエリパラメータ契約と各フィルタのクエリ意味論
- [quickstart.md](./quickstart.md): 期間・深度・タイプ・複合・URL 復元・0 件・不正範囲の検証手順
- Agent context: `.claude/CLAUDE.md` の SPECKIT マーカー内 plan 参照を本 plan に更新

## Complexity Tracking

違反なし（記載不要）。
