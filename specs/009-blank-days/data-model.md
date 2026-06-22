# Data Model: ブランク日数の表示

## スキーマ変更

**なし。** ブランク日数は導出値であり、テーブル・カラム・マイグレーションの追加は行わない（`rules/sql.md`「計算可能な値を冗長に保存しない」に準拠）。

## 参照する既存データ

| テーブル | 参照内容 | 経路 |
|---------|---------|------|
| `public.dives` | `dive_date` の最新 1 件（`order by dive_date desc limit 1`） | 既存の `getDashboardHero`（`features/dashboard/server/queries.ts`）が取得済み。追加クエリなし |

アクセス制御は `dives` の既存 RLS（本人のみ select 可）に乗る。本機能での変更はない。

## 導出値: ブランク日数

| 項目 | 内容 |
|------|------|
| 定義 | 最新のダイブログ日付（`dive_date`）から現在日（JST）までの暦日差。最小 0 |
| 実装 | `features/dashboard/lib/blankDays.ts` の純粋関数 `calcBlankDays(lastDiveOn, today)`。DB には保存しない |
| 境界 | ログ 0 件 → `null`（表示しない） / 当日 → `0` / 未来日ログ → `0` に丸める（マイナス禁止） |
| 表示例 | 「最後に潜ってから **45**日」「**0**日（今日もダイビング日和！）」 |
