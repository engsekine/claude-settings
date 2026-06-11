# ダイビング予定 作成 / 編集フォーム

## メタ情報

| 項目 | 内容 |
|------|------|
| 画面ID | `plan-form` |
| 関連機能 | [004 spec.md](../spec.md)（US1 / FR-002〜004） |
| ルート | `/plans/new`（新規）/ `/plans/[id]/edit`（編集） |
| 認証 | 必須 |
| 実装 | `features/plans/components/client/PlanForm/`（新規・編集共有。`planId` の有無でモード判定） |

## 項目定義

| 項目 | UI | 必須 | バリデーション（`plan.schema.ts`） | 初期値 |
|------|----|----|----|----|
| 予定日 | FormField `type="date"` | ✅ | YYYY-MM-DD 形式・実在日付。**過去日も許可**（終了済み予定になるだけ） | 新規: JST の今日 / 編集: 既存値 |
| ポイント名 | FormField `type="text"` | ✅ | 1〜120 文字（trim） | 編集: 既存値 |
| メモ | FormTextarea rows=4 | — | ≤2000 文字。空は null | 編集: 既存値 |

エラーメッセージはフィールド単位（`<id>-error` + `role="alert"`、FormField 共通実装）。

## ボタン

| ボタン | 挙動 |
|------|------|
| 作成する / 更新する | `createPlan` / `updatePlan`（Server Action、`ActionResult`）。送信中は `disabled` + `aria-busy` +「保存中...」 |
| キャンセル | `/plans` へのリンク |

## 挙動

- 作成成功 → `/plans/[id]`（作成された予定の詳細）へ遷移。**このとき持ち物リストにデフォルト 12 項目が展開済み**（FR-011、`createPlan` 内で一括 insert）
- 更新成功 → `/plans/[id]` へ遷移
- Action 失敗 → `result.error` をフォーム上部に `role="alert"` で表示
