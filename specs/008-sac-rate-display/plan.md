# Implementation Plan: エア消費率（SAC）の自動計算・表示

**Branch**: `008-sac-rate-display` | **Date**: 2026-06-13 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/008-sac-rate-display/spec.md`

## Summary

ダイビング記録の既存 5 項目（開始残圧・終了残圧・タンク容量・平均水深・潜水時間）からエア消費率（SAC: 水面換算の毎分ガス消費量、L/分）を純粋関数で算出し、記録詳細（DiveDetail）に表示する。必要項目が欠けている場合は不足項目が分かる案内を表示して入力を促す。DB スキーマ変更・外部 API・追加ライブラリはいずれも行わない（007 潮回り表示と同じ「保存しない導出値」パターン）。算出ロジックは利用が dives feature に閉じるため `features/dives/lib/sacRate.ts` に置く。

## Technical Context

**Language/Version**: TypeScript（strict mode）/ React 19 / Next.js 16（App Router、React Compiler 有効）

**Primary Dependencies**: 追加依存なし。SAC 計算は四則演算のみの自前の純粋関数（[research.md R1](research.md)）。表示は既存 DiveDetail への統合のみ（Tailwind CSS）

**Storage**: N/A — スキーマ変更なし。SAC は保存しない導出値（FR-003）。参照する入力は既存の `dives` テーブルの 5 カラム（[data-model.md](data-model.md)）

**Testing**: Vitest（`sacRate.test.ts` の単体テスト + `DiveDetail.test.tsx` の同期更新）、Storybook（`DiveDetail.stories.tsx` 同期更新）、Playwright（既存 `tests/a11y/dives-pages.spec.ts` の再実行。007 で整備済みのため新規 spec 不要）

**Target Platform**: Web（モバイル / タブレット / PC、モバイルファースト）

**Performance Goals**: 算出は O(1) の四則演算のみ。詳細画面 1 件分の計算で体感影響なし（外部フェッチゼロ）

**Constraints**: DB 保存なし / 外部サービス・外部データ取得なし / 追加ライブラリなし。計算は「水深 10 m = 1 気圧加算」の慣習近似（海水・淡水の密度差は補正しない）。表示は小数第 1 位（四捨五入）。不足項目の案内は計算結果が不正（消費量 ≦ 0）の場合には出さない（FR-005）

**Scale/Scope**: 新規ファイル 2（`sacRate.ts` + test）、既存コンポーネントの変更 1 箇所（DiveDetail + test / story 同期）。画面の新設なし

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| 原則 | 準拠 | 確認内容 |
|------|------|---------|
| I. Spec-Driven Development | ✅ | spec.md 作成済み（チェックリスト全項目パス）。本 plan → tasks → 実装の順で進める |
| II. Server Components First | ✅ | 新規ページなし。純粋関数を Server Component（DiveDetail）内で直接呼ぶ。Client Component の追加なし |
| III. Test-First | ✅ | `sacRate.test.ts` を実装より先に書く。DiveDetail は 007 で整備済みの test / story を同期更新（テスト同期ルール） |
| IV. Security & RLS by Default | ✅ | DB 変更なし・新規データアクセスなし。既存クエリが返す数値を表示時に変換するのみで、RLS 境界に影響しない |
| V. Accessibility | ✅ | SAC は数値 + 単位のテキスト表示で色のみに依存しない（FR-008）。不足案内もテキスト。既存画面の axe-core 違反 0 件を維持 |
| VI. Coding Standards | ✅ | 純粋関数 + イミュータブル。`features/dives/lib/` の既存慣習（`calcBottomTime.ts`）に合わせる。判別共用体で状態を型表現 |

**Phase 1 設計後の再評価**: 違反なし。導出値を保存しない設計は sql.md「計算可能な値を冗長に保存しない」に適合。新規コンポーネント・新規ページなし（Complexity Tracking 不要）。

## Project Structure

### Documentation (this feature)

```text
specs/008-sac-rate-display/
├── spec.md              # 機能仕様
├── plan.md              # This file
├── research.md          # Phase 0: 設計判断の記録
├── data-model.md        # 導出値（SAC）の定義・計算式・検証用フィクスチャ。スキーマ変更なしの宣言
├── quickstart.md        # 動作検証手順
├── checklists/
│   └── requirements.md  # spec 品質チェックリスト
└── tasks.md             # Phase 2 出力（/speckit-tasks で生成 — 本コマンドでは作らない）
```

contracts/ は作成しない。外部公開 API はなく、インターフェースは `features/dives/lib/sacRate.ts` の純粋関数に閉じるため、その入出力は本ファイルと data-model.md で定義する。

### Source Code (repository root)

```text
service-front/src/features/dives/
├── lib/
│   ├── sacRate.ts                               # 新規: SAC 算出の純粋関数 + 不足項目ラベル定数
│   └── sacRate.test.ts                          # 新規: 単体テスト（代表値・丸め・不足・不正）
└── components/server/DiveDetail/
    ├── DiveDetail.tsx                           # 変更: タンク・装備セクションに SAC / 不足案内を表示
    ├── DiveDetail.test.tsx                      # 同期更新（007 で整備済み）
    └── DiveDetail.stories.tsx                   # 同期更新（007 で整備済み）
```

**Structure Decision**: 算出ロジックは利用が dives feature に閉じるため `features/dives/lib/` に置く（[research.md R2](research.md)）。同階層の `calcBottomTime.ts`（ダイブ計算の純粋関数）と同じ慣習に従う。新規 UI コンポーネントは作らず DiveDetail に直接統合する。

## 設計詳細

### SAC 算出仕様（`features/dives/lib/sacRate.ts`）

| 項目 | 内容 |
|------|------|
| 公開 API | `calcSacRate(input): SacRateResult` / `SAC_INPUT_FIELD_LABELS: Record<SacInputField, string>` / `formatSacRate(sacRateLpm: number): string` |
| 入力 | `{ pressureStartBar, pressureEndBar, tankVolumeL, avgDepthM: number \| null, bottomTimeMin: number }`（`Dive` 型の該当フィールドをそのまま渡せる形） |
| 結果型 | 判別共用体 `SacRateResult =`<br>`\| { status: 'ok'; sacRateLpm: number }`<br>`\| { status: 'missing'; missingFields: SacInputField[] }`<br>`\| { status: 'invalid' }` |
| 計算式 | 消費ガス量[L] = (開始残圧 − 終了残圧) × タンク容量<br>周囲圧[気圧] = 平均水深 ÷ 10 + 1<br>SAC[L/分] = 消費ガス量 ÷ 潜水時間 ÷ 周囲圧 |
| missing | 開始残圧・終了残圧・タンク容量・平均水深のいずれかが null のとき。`missingFields` に不足項目を列挙（`SacInputField = 'pressureStartBar' \| 'pressureEndBar' \| 'tankVolumeL' \| 'avgDepthM'`。潜水時間は必須項目のため対象外） |
| invalid | 5 項目が揃っていても消費ガス量 ≦ 0（開始残圧 ≦ 終了残圧）のとき。タンク容量 ≦ 0・潜水時間 ≦ 0 も防御的に invalid 扱い（DB CHECK で通常は発生しない） |
| 丸め | `sacRateLpm` は丸めずに返し、表示時に `formatSacRate` が小数第 1 位へ四捨五入して「15.0 L/分」形式の文字列にする |
| 決定性 | 現在時刻・乱数に依存しない。同一入力は常に同一出力（FR-006） |

### 表示統合方針（DiveDetail）

- 「タンク・装備」セクションの末尾（装備メモの前）に表示する。残圧・タンク容量と同じ文脈に置き、入力値との関係を理解しやすくする
- `status: 'ok'` → 既存の `Field` と同じ見た目で「エア消費率」ラベル + `formatSacRate` の値（例: 15.0 L/分）を表示
- `status: 'missing'` → `missingFields` を `SAC_INPUT_FIELD_LABELS` で日本語化し、「開始残圧・平均水深を入力するとエア消費率が表示されます」形式の案内テキスト（`text-muted-foreground`）を表示
- `status: 'invalid'` → SAC 関連の要素を一切描画しない（FR-005。既存レイアウトを崩さない）
- 数値・案内ともテキスト表示で色のみに依存しない（FR-008）

### エラー・境界の扱い

- 平均水深 0 m は周囲圧 1 気圧として正常に計算する（missing ではない）
- 極端な計算結果も補正せずそのまま表示する（spec Edge Case）
- 編集保存後は詳細が再描画され、表示時計算のため自動で再計算される（FR 上の「再計算」は構造的に充足）

## Complexity Tracking

違反なしのため記載なし。
