# Implementation Plan: 潮回り表示（ダイビング記録・予定）

**Branch**: `007-tide-phase-display` | **Date**: 2026-06-12 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/007-tide-phase-display/spec.md`

## Summary

ダイビング記録・予定の日付（YYYY-MM-DD）から潮回り（大潮・中潮・小潮・長潮・若潮）を月齢ベースの純粋関数で算出し、記録一覧・詳細、予定一覧・詳細、TOP の「次の予定」カード・「最近のダイビング」リストの計 6 箇所に表示する。DB スキーマ変更・外部 API・追加ライブラリはいずれも行わない（保存しない導出値）。算出ロジックは dives / plans の両 feature から使うため `shared/lib/tide.ts` に置く（feature 間 import 禁止のため shared 層）。

## Technical Context

**Language/Version**: TypeScript（strict mode）/ React 19 / Next.js 16（App Router、React Compiler 有効）

**Primary Dependencies**: 追加依存なし。月齢計算は平均朔望月による自前の純粋関数で実装（[research.md R1](research.md)）。表示は既存コンポーネントへの統合のみ（Tailwind CSS）

**Storage**: N/A — スキーマ変更なし。潮回りは保存しない導出値（FR-004）。参照する日付は既存の `dives.dive_date` / `dive_plans.planned_on`

**Testing**: Vitest（`tide.test.ts` の単体テスト + 表示統合した各コンポーネントの test 同期更新）、Storybook（story 同期更新）、Playwright（予定一覧・新規は既存 `plans-pages.spec.ts` を再実行。記録一覧・記録詳細・TOP・予定詳細は a11y spec 未整備のため本機能で新規作成・追記する）

**Target Platform**: Web（モバイル / タブレット / PC、モバイルファースト）

**Performance Goals**: 算出は O(1) の算術演算のみ。一覧 N 件への表示追加でも体感影響なし（外部フェッチゼロ）

**Constraints**: DB 保存なし / 外部サービス・外部データ取得なし / 追加ライブラリなし（ユーザー指定）。月齢は近似計算とし、公式潮汐表と前後 1 日のズレを許容（spec Assumptions）。日付は既存の YYYY-MM-DD 文字列規約（`shared/lib/date.ts` と同じ）に従い、評価時刻は JST 正午に固定して決定性を保証する

**Scale/Scope**: 新規ファイル 2（`tide.ts` + test）、既存コンポーネント・ページの変更 6 箇所。画面の新設なし

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 準拠 | 確認内容 |
|------|------|---------|
| I. Spec-Driven Development | ✅ | spec.md 作成済み（チェックリスト全項目パス）。本 plan → tasks → 実装の順で進める |
| II. Server Components First | ✅ | 新規ページなし。純粋関数は Server / Client どちらのコンポーネントでも動作し、各表示箇所の既存のレンダリング方式（DiveDetail / NextPlanCardView / RecentDives = Server、DiveCard / PlanList = Client）を変えない |
| III. Test-First | ✅ | `tide.test.ts` を実装より先に書く。表示を統合する既存コンポーネントは同階層の test / story を同期更新（テスト同期ルール） |
| IV. Security & RLS by Default | ✅ | DB 変更なし・新規データアクセスなし。既存クエリが返す日付を表示時に変換するのみで、RLS 境界に影響しない |
| V. Accessibility | ✅ | 潮回りはテキストラベルで表示し色のみに依存しない（FR-008）。表示対象画面の axe-core 違反 0 件（dives 系・TOP・予定詳細の a11y spec は本機能で新規整備） |
| VI. Coding Standards | ✅ | 純粋関数 + イミュータブル。日付は文字列ベース規約。`shared/lib/` の既存フラットファイル慣習（date.ts / number.ts）に合わせる |

**Phase 1 設計後の再評価**: 違反なし。導出値を保存しない設計は sql.md「計算可能な値を冗長に保存しない」に適合。新規コンポーネントを作らないため、コンポーネントフォルダ規約の対象追加もなし（Complexity Tracking 不要）。

## Project Structure

### Documentation (this feature)

```text
specs/007-tide-phase-display/
├── spec.md              # 機能仕様
├── plan.md              # This file
├── research.md          # Phase 0: 設計判断の記録
├── data-model.md        # 導出値（潮回り）の定義とマッピング表。スキーマ変更なしの宣言
├── quickstart.md        # 動作検証手順
├── checklists/
│   └── requirements.md  # spec 品質チェックリスト
└── tasks.md             # Phase 2 出力（/speckit-tasks で生成 — 本コマンドでは作らない）
```

contracts/ は作成しない。外部公開 API はなく、インターフェースは `shared/lib/tide.ts` の純粋関数 1 つに閉じるため、その入出力は本ファイルと data-model.md で定義する。

### Source Code (repository root)

```text
service-front/src/
├── shared/lib/
│   ├── tide.ts                                      # 新規: 月齢 → 潮回りの純粋関数 + ラベル定数
│   └── tide.test.ts                                 # 新規: 単体テスト（境界値・循環順序）
├── features/dives/components/
│   ├── client/DiveCard/DiveCard.tsx                 # 変更: 記録一覧カードに潮回り表示（test / story 同期）
│   └── server/DiveDetail/DiveDetail.tsx             # 変更: 記録詳細に潮回り表示（test / story 同期）
├── features/plans/components/
│   ├── client/PlanList/PlanList.tsx                 # 変更: 予定一覧に潮回り表示（test / story 同期）
│   └── server/NextPlanCard/NextPlanCardView.tsx     # 変更: TOP「次の予定」カードに潮回り表示（test / story 同期）
├── features/dashboard/components/
│   └── server/RecentDives/RecentDives.tsx           # 変更: TOP「最近のダイビング」リストに潮回り表示（test / story 同期。追加要望 2026-06-13）
└── app/(authenticated)/plans/[id]/page.tsx          # 変更: 予定詳細に潮回り表示
```

**Structure Decision**: 算出ロジックは dives / plans 両 feature が参照するため、feature 間 import 禁止の原則に従い `shared/lib/` に置く（[research.md R3](research.md)）。新規 UI コンポーネントは作らず、既存コンポーネントにテキストラベルとして統合する（[research.md R4](research.md)）。

## 設計詳細

### 潮回り算出仕様（`shared/lib/tide.ts`）

| 項目 | 内容 |
|------|------|
| 公開 API | `getTidePhase(date: string): TidePhase \| null` / `TIDE_PHASE_LABELS: Record<TidePhase, string>` |
| 型 | `type TidePhase = 'spring' \| 'middle' \| 'neap' \| 'long' \| 'young'`（値 → ラベル: 大潮 / 中潮 / 小潮 / 長潮 / 若潮。agency の小文字キー + 表示ラベル方式に合わせる） |
| 入力 | `YYYY-MM-DD` 文字列。形式不正・解釈不能な値は `null` を返し、呼び出し側は潮回り表示そのものを描画しない（FR-007） |
| 月齢 | 基準朔 `2000-01-06 18:14 UTC` からの経過日数を平均朔望月 29.530588853 日で剰余（負値補正あり）。評価時刻は対象日の JST 正午（= `T03:00:00Z`）に固定 |
| 区分 | 旧暦日相当 = `floor(月齢) + 1`（1〜30）→ [data-model.md のマッピング表](data-model.md) で 5 区分へ変換 |
| 決定性 | `Date.now()` 等の現在時刻に依存しない。同一入力は常に同一出力（FR-006） |

### 表示統合方針

- 各表示箇所で `getTidePhase(diveDate / plannedOn)` を呼び、`TIDE_PHASE_LABELS[phase]` をテキストラベル（Tailwind のバッジ風スタイル可）として日付の近くに表示する
- ラベルは必ず区分名テキストを含め、色のみで区別しない（FR-008）。`aria-hidden` な装飾と `sr-only` の併用はしない（テキスト自体が読み上げ対象）
- `null` のときはラベル要素ごと描画せず、既存レイアウトを崩さない（FR-007）
- Server Component（DiveDetail / NextPlanCardView / plans/[id] ページ）でも Client Component（DiveCard / PlanList）でも同じ純粋関数を直接 import する（`'use client'` 不要のユニバーサルなモジュール)

### 境界・精度の扱い

- 月齢 29.x（旧暦 30 日相当）は大潮。`floor` により全入力が必ず 5 区分のいずれかに落ち、未分類は発生しない
- 平均朔望月による近似のため真の朔望と最大 ±1 日程度ずれうる。spec の Assumptions（参考情報の位置づけ）で許容済み。単体テストは実際の天文現象ではなく本仕様の基準朔からの計算結果を固定値で検証する（回帰検知が目的）

## Complexity Tracking

違反なしのため記載なし。
