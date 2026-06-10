# 002 ログ CRUD - タスク

## 前提

- 001 認証が完了していること
- `@repo/supabase` 利用可能
- Supabase ローカル環境が起動できる

## タスク

### マイグレーション

- [ ] T1: `supabase/migrations/00x_create_dives.sql` を作成
- [ ] T2: RLS ポリシーを設定
- [ ] T3: インデックスを作成
- [ ] T4: `updated_at` 自動更新の trigger 追加
- [ ] T5: `npx supabase db reset` で適用確認

### feature 雛形

- [ ] T6: `features/dives/types.ts` 定義
- [ ] T7: `features/dives/constants.ts`（dive_type / gas_type の選択肢）
- [ ] T8: `features/dives/schemas/dive.schema.ts`（yup）
- [ ] T9: `features/dives/server/queries.ts`（一覧 / 詳細）
- [ ] T10: `features/dives/server/actions.ts`（作成 / 更新 / 削除）
- [ ] T11: `features/dives/hooks/useDives.ts`（TanStack Query）

### UI コンポーネント

- [ ] T12: `DiveCard`（一覧の 1 行）
- [ ] T13: `DiveList`（カード並び + ページング）
- [ ] T14: `DiveSearchBar`（日付範囲・ポイント名）
- [ ] T15: `DiveForm`（新規・編集共有）
- [ ] T16: `DiveDetail`（詳細表示）
- [ ] T17: `DeleteDiveButton`（確認ダイアログ付き）

### ページ

- [ ] T18: `/dives` 一覧ページ
- [ ] T19: `/dives/new` 新規作成ページ
- [ ] T20: `/dives/[id]` 詳細ページ
- [ ] T21: `/dives/[id]/edit` 編集ページ

### テスト

- [ ] T22: yup スキーマ単体テスト
- [ ] T23: Server Actions 単体テスト
- [ ] T24: E2E（作成 → 一覧表示 → 編集 → 削除）
- [ ] T25: 他ユーザーの dive_id にアクセスして 404 が返ることを確認

## 受け入れ確認

- [ ] requirements.md の全受け入れ条件を満たす
- [ ] RLS が機能していることを Supabase Studio で確認
- [ ] 21 件以上のログでページングが動作する
- [ ] 検索（日付・ポイント名）が動作する
