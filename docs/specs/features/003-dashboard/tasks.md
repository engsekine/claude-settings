# 003 ダッシュボード - タスク

## 前提

- 001 認証 / 002 ログ CRUD が完了していること
- `@repo/supabase` 利用可能
- Supabase ローカル環境が起動できる

## タスク

### マイグレーション

- [ ] T1: `supabase/migrations/<ts>_create_regulators.sql` を作成（テーブル + 制約 + 部分ユニーク）
- [ ] T2: `regulators` の RLS ポリシー（select/insert/update/delete を `auth.uid() = user_id` で）
- [ ] T3: インデックス `idx_regulators_user_id_is_primary`
- [ ] T4: `updated_at` 自動更新 trigger（`handle_updated_at` を再利用）
- [ ] T5: RPC `get_dive_stats()` を `supabase/migrations/<ts>_create_get_dive_stats.sql` で作成（`stable security invoker search_path=''`）
- [ ] T6: `npx supabase db reset` で全マイグレーションが通ることを確認
- [ ] T7: 型を再生成（`supabase gen types`）して `@repo/supabase` の Database 型を更新

### 認証ルーティング

- [ ] T8: `src/proxy.ts` の `APP_ROUTE_PREFIXES` に `/` と `/settings` を追加
- [ ] T9: 未認証で `/` にアクセスすると `/login` にリダイレクトされることを確認

### feature: regulators

- [ ] T10: `features/regulators/types.ts` 定義（`Regulator`、`RegulatorListItem` など）
- [ ] T11: `features/regulators/schemas/regulator.schema.ts`（yup）
- [ ] T12: `features/regulators/server/queries.ts`（`listRegulators` / `getRegulator`）
- [ ] T13: `features/regulators/server/actions.ts`（`createRegulator` / `updateRegulator` / `deleteRegulator` / `recordOverhaul`）
- [ ] T14: `RegulatorList`（Server Component、一覧）
- [ ] T15: `RegulatorForm`（Client Component、新規・編集共通）
- [ ] T16: `DeleteRegulatorButton`（確認ダイアログ付き）

### feature: dashboard

- [ ] T17: `features/dashboard/types.ts`（`DiveStats`、`RegulatorOverhaulStatus` など）
- [ ] T18: `features/dashboard/lib/overhaul.ts`（OH ステータス計算の純粋関数）
- [ ] T19: `features/dashboard/server/queries.ts`（`getDiveStats` / `getPrimaryRegulatorStatus`）
- [ ] T20: `StatsCards`（統計カード × 4 を表示）
- [ ] T21: `RegulatorPanel`（OH ステータス、未登録時の CTA、レベル別色分け）
- [ ] T22: `RecordOverhaulButton`（Client Component、確認ダイアログ + Server Action 呼び出し）
- [ ] T23: `RecentDives`（最近 5 件、`listDives({ limit: 5 })` を再利用）
- [ ] T24: `TopDashboard`（Server Component、上記を組み立てる）

### ページ

- [ ] T25: `src/app/page.tsx` を書き換えて `TopDashboard` を描画
- [ ] T26: `src/app/(authenticated)/settings/equipment/page.tsx` を作成（`RegulatorList` を描画）
- [ ] T27: `src/app/(authenticated)/settings/equipment/new/page.tsx`
- [ ] T28: `src/app/(authenticated)/settings/equipment/[id]/edit/page.tsx`
- [ ] T29: 各ページに `generatePageMetadata` で metadata を付与

### テスト

- [ ] T30: `overhaul.ts` 単体テスト（境界: 残日数 0 / 30 / 31、残本数 0 / 10 / 11）
- [ ] T31: `regulator.schema.ts` 単体テスト（必須・最大長・未来日付・interval 範囲）
- [ ] T32: `RegulatorForm` テスト（送信成功・バリデーションエラー）
- [ ] T33: `StatsCards` テスト（0 件 / 通常 / 60 分未満 / 100 時間超 の表示）
- [ ] T34: `RegulatorPanel` テスト（未登録 / 余裕 / 期限間近 / 期限切れ）
- [ ] T35: E2E: 未認証 `/` → `/login` リダイレクト
- [ ] T36: E2E: レギュレーター登録 → TOP に反映 → メンテ完了記録 → 残日数リセット
- [ ] T37: 他ユーザーの `regulators.id` で 404 が返ることを確認

### スクリーン仕様の更新

- [ ] T38: `docs/specs/screens/top.md` の TBD を確定値に書き換える
- [ ] T39: `docs/specs/tables/regulators.md` を新規作成（マイグレーション確定後）

### 周辺整備

- [ ] T40: `docs/product.md` の機能仕様一覧を更新（003 を Dashboard に、PDF / 公開を 004 / 005 に）
- [ ] T41: `Header` / `Breadcrumbs` の「ホーム」リンク先を `/` に整合

## 受け入れ確認

- [ ] requirements.md の全受け入れ条件を満たす
- [ ] 未認証で `/` にアクセスすると `/login` に遷移する
- [ ] 認証済みで `/` にアクセスすると累計統計とメイン機材 OH が表示される
- [ ] ダイブログ 0 件のときも TOP がエラーなく描画される
- [ ] レギュレーター未登録のときも TOP がエラーなく描画される
- [ ] 「メンテ完了を記録」を押すと OH ステータスが即座に更新される
- [ ] 他ユーザーのレギュレーターは RLS で読み書きできない
- [ ] 全カラーコントラスト比が WCAG AA を満たす（特に警告 / エラー色）
