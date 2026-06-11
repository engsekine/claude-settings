# Research: TOP ページ拡張（ダイビング予定 / 持ち物リスト）

Phase 0 の設計判断の記録。Technical Context に NEEDS CLARIFICATION は残っていない。

## Decision 1: 一覧のデータ取得は Server Components のみ（TanStack Query 不使用）

- **Decision**: 予定一覧・持ち物リストは Server Components で全件取得し、クライアントフェッチ・ページネーションを行わない
- **Rationale**: 予定はユーザーあたり高々数十件で、dives のような無限スクロール要件がない。クライアントフェッチを持ち込むと 002 で起きた「サーバー / クライアントのクエリ二重実装」リスク（arch/feature-based.md で禁止）を不必要に抱える
- **Alternatives considered**: TanStack Query + カーソルページネーション（002 と同構成）→ 件数規模に対して過剰。要件が出たら後続で導入

## Decision 2: デフォルト持ち物は「作成時に行として複製」する

- **Decision**: デフォルト項目はコード内定数（`lib/default-packing-items.ts`）に持ち、`createPlan` 時に `plan_packing_items` へ一括 insert する
- **Rationale**: 展開後は通常の行として編集・削除・チェックでき、FR-011〜013 が単純な CRUD に帰着する。デフォルト定義の将来変更が既存予定に影響しない（スナップショット性）
- **Alternatives considered**:
  - DB にテンプレートテーブルを持つ → ユーザー編集可能テンプレートはスコープ外（spec 確認済み）のため、テーブルが 1 つ増えるだけで利点がない
  - 仮想表示（未チェックのデフォルトは行を作らず、操作時に初めて insert）→ 表示と実体の二重管理になり複雑

## Decision 3: 持ち物チェックの更新は Server Action + `router.refresh()`（楽観更新なし）

- **Decision**: `togglePackingItem` を `useTransition` で呼び、完了後に `router.refresh()` で再取得する。`useOptimistic` は使わない
- **Rationale**: 更新対象は 1 行の boolean で往復が軽く、`isPending` でチェックボックスを無効化すれば UX は十分。楽観更新は失敗時の巻き戻し処理が増える
- **Alternatives considered**: `useOptimistic` による即時反映 → 体感差が小さい割に複雑化。SC-003（状態の永続化 100%）の検証はどちらでも可能

## Decision 4: 「終了済み」はステータスカラムを持たず `planned_on < 今日` で導出

- **Decision**: `dive_plans` に status カラムは作らず、表示時に JST の今日と比較して「終了済み」を導出する
- **Rationale**: 計算可能な値を冗長に保存しない（`.claude/rules/sql.md`）。日付が過ぎたら自動的に終了済みになり、バッチ更新が不要
- **Alternatives considered**: `status text`（planned / done / cancelled）→ キャンセル概念は spec にない。必要になったら後続マイグレーションで追加

## Decision 5: 残り日数は JST 基準の純粋関数で計算

- **Decision**: `daysUntil(plannedOn, today)` を純粋関数として実装し、`today` には `todayInJst()`（`@/shared/lib/date`）を渡す
- **Rationale**: UTC 基準だと JST 早朝に「今日の予定」が「終了済み」扱いになる（dive.schema の既知パターンと同じ問題）。`today` を引数化することでタイムゾーン起因のテストが決定的になる
- **Alternatives considered**: クライアントの `new Date()` 基準 → SSR とのズレで hydration 差分が出るリスク。サーバー側で計算した値を表示に使う

## Decision 6: 進捗集計はクエリで都度集計（カウンタの冗長保存なし）

- **Decision**: TOP の持ち物進捗（checked / total）は `plan_packing_items` を集計して取得する（`getNextPlanWithProgress`）
- **Rationale**: 1 予定あたり高々数十行の count で、冗長カウンタ（`dive_plans.checked_count` 等）を持つとトリガ整合性の管理コストが上回る（sql.md「計算可能な値を冗長に保存しない」）
- **Alternatives considered**: カウンタカラム + トリガ → 過剰最適化
