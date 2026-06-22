# Implementation Plan: ブランク日数の表示

**Branch**: `feature/009-blank-days` | **Date**: 2026-06-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/009-blank-days/spec.md`

## Summary

TOP ダッシュボードのヒーローに、最後のダイブログ日付から現在までの経過日数（ブランク日数）を「ブランク ○日」として一目でわかる形で表示する。既存ヒーローの文章表現「前回のダイブから ○ 日」を置き換え、ショップ申告にそのまま使える明示的な数値表示にする。計算は既存の `daysUntil`（`shared/lib/date.ts`）を流用した純粋関数 `calcBlankDays` に切り出し、未来日ログで負になる既存の潜在バグも 0 日に丸めて解消する。DB 変更なし（導出値のみ）。

## Technical Context

**Language/Version**: TypeScript（strict mode）/ React 19 / Next.js 16（App Router、React Compiler 有効）

**Primary Dependencies**: 既存の `@/shared/lib/date`（`daysUntil` / `todayInJst`）。新規依存なし

**Storage**: 変更なし。既存 `dives.dive_date` の最新 1 件を参照するのみ（`getDashboardHero` が取得済み）

**Testing**: Vitest（`calcBlankDays` 純粋関数・`BlankDays` コンポーネント単体）、Storybook（story + テスト）、Playwright（TOP の a11y は既存スキャン対象）

**Target Platform**: Web（モバイル / タブレット / PC、モバイルファースト）

**Project Type**: Web アプリケーション（モノレポ内 `service-front`）。`features/dashboard` 内で完結

**Performance Goals**: 追加クエリなし（既存 `getDashboardHero` の取得データを流用するため TOP の表示性能に影響しない）

**Constraints**: WCAG 2.1 AA 準拠（数値の強調は色だけに依存しない・コントラスト 4.5:1 以上）/ 日付は JST 基準の暦日差 / 計算結果は最小 0（マイナス表示禁止）

**Scale/Scope**: 画面変更は TOP ヒーローのみ。新規コンポーネント 1 つ + 純粋関数 1 つ

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 準拠 | 確認内容 |
|------|------|---------|
| I. Spec-Driven Development | ✅ | spec.md 承認済み（checklists 16/16 PASS）。本 plan → tasks → 実装の順で進める |
| II. Server Components First | ✅ | `BlankDays` は表示専用の Server Component（`'use client'` なし）。データ取得は既存の Server Component（TopDashboard → getDashboardHero）に乗る |
| III. Test-First | ✅ | `calcBlankDays` のテストを実装より先に書く。`BlankDays` コンポーネントは `/generate-with-tests` で test / story を同梱 |
| IV. Security & RLS by Default | ✅ | スキーマ変更なし。参照する `dives` は既存 RLS で本人のみに制限済み |
| V. Accessibility | ✅ | 数値はテキストとして読み上げ可能な構造（「ブランク ○日」が 1 つの文として伝わる）。コントラスト基準を満たす既存トークンのみ使用 |
| VI. Coding Standards | ✅ | 純粋関数は `features/dashboard/lib/`、コンポーネントはフォルダ規約（本体 + test + stories + index.ts）。導出値を保存しない（sql.md 準拠） |

**Phase 1 設計後の再評価**: 違反なし（Complexity Tracking 不要）。

## Project Structure

### Documentation (this feature)

```text
specs/009-blank-days/
├── spec.md              # 機能仕様
├── plan.md              # This file
├── research.md          # Phase 0: 設計判断の記録
├── data-model.md        # スキーマ変更なしの宣言 + 導出値の定義
├── quickstart.md        # 動作検証手順
├── checklists/
│   └── requirements.md  # spec 品質チェックリスト
└── tasks.md             # Phase 2 出力（/speckit-tasks で生成）
```

contracts/ は作成しない。外部公開 API はなく、変更は `features/dashboard` 内の表示と導出計算に閉じる。

### Source Code (repository root)

```text
service-front/src/features/dashboard/
├── components/server/
│   ├── TopDashboard/TopDashboard.tsx       # 変更: ヒーローの文言を BlankDays に置き換え
│   └── BlankDays/                          # 新規: ブランク日数の表示（Server Component）
│       ├── BlankDays.tsx
│       ├── BlankDays.test.tsx
│       ├── BlankDays.stories.tsx
│       └── index.ts
├── lib/
│   ├── blankDays.ts                        # 新規: calcBlankDays 純粋関数
│   └── blankDays.test.ts
├── server/queries.ts                       # 変更: getDashboardHero が calcBlankDays を使う
└── types.ts                                # 変更: DashboardHero.daysSinceLastDive → blankDays に改名
```

**Structure Decision**: 既存の `features/dashboard` 構成（`lib/overhaul.ts` の純粋関数パターン、`components/server/` の表示コンポーネントパターン）を踏襲する。feature 間 import は発生しない（dives テーブルの参照は既存クエリのまま）。

## 設計詳細

### 計算仕様（`lib/blankDays.ts`）

- シグネチャ: `calcBlankDays(lastDiveOn: string | null, today: string): number | null`
- 両引数とも YYYY-MM-DD（JST 基準）。`daysUntil(lastDiveOn, today)` を符号反転し、`Math.max(0, ...)` で下限 0 に丸める
- `lastDiveOn === null`（ログ 0 件）は `null` を返す
- 既存実装 `-daysUntil(...)` は未来日ログで負になりうる（潜在バグ）ため、本関数への置き換えで FR-003 を満たす

### 表示仕様（`BlankDays`）

- Props: `{ blankDays: number }`（数値強調の表示専用。null 分岐は TopDashboard 側が担う）
- 表示: 「最後に潜ってから」のラベル + 強調された数値 + 「日」。`blankDays === 0` のときは補足文言「今日もダイビング日和！」を添える（既存メッセージを踏襲）
- セマンティクス: 全体が 1 つの段落として読み上げられる構造（数値だけが孤立しない）

### TopDashboard の変更

| 状態 | 表示 |
|------|------|
| `hero.blankDays === null`（ログ 0 件） | 既存文言「まだダイブログがありません。最初の 1 本を記録しましょう」を維持（FR-004） |
| `hero.blankDays !== null` | `<BlankDays blankDays={hero.blankDays} />` |

`DashboardHero.daysSinceLastDive` はプロダクト用語に合わせ `blankDays` へ改名する（参照箇所は `queries.ts` / `TopDashboard.tsx` のみ）。

## Complexity Tracking

違反なしのため記載なし。
