# Quickstart: TOP ページ拡張（ダイビング予定 / 持ち物リスト）

実装後に機能が end-to-end で動くことを検証する手順。実装詳細は [plan.md](plan.md)・[data-model.md](data-model.md) を参照。

## 前提

- Docker（Supabase ローカル + service-front コンテナ）が起動済み
- テストユーザー: `test@example.com` / `supabase/seed.sql` 定義のパスワード

## セットアップ

```bash
# マイグレーション適用 + 型再生成
npx supabase migration up
npx supabase gen types typescript --local > packages/supabase/src/types.ts

# アプリ起動（Docker 構成なら docker compose -f service-front/docker-compose.dev.yml up）
# ブラウザ: https://localhost:3000
```

## 検証シナリオ

### 1. 予定の CRUD（US1 / FR-001〜005）

1. ログイン後 `/plans` を開く → 空状態（予定 0 件の CTA）が表示される
2. 「予定を作成」→ 予定日（未来日）とポイント名を入力して保存 → `/plans` に予定が表示される
3. 必須項目を空にして保存 → フィールド単位のエラーが表示される
4. 予定を編集してポイント名を変更 → 一覧に反映される
5. 過去日の予定を作成 → 「終了済み」区分に表示される
6. 予定を削除（確認ダイアログ → OK）→ 一覧から消える

### 2. 持ち物リスト（US3 / FR-010〜014）

1. 予定詳細を開く → デフォルト 12 項目が未チェックで表示される
2. 項目をチェック → リロードしても状態が維持される（SC-003）
3. カスタム項目「酔い止め」を追加 → 末尾に表示される
4. 項目を削除 → リストから消える
5. 予定自体を削除 → 持ち物も消えている（DB: `select count(*) from plan_packing_items where plan_id = '<削除した id>';` が 0）

### 3. TOP 統合（US2 / FR-006〜009）

1. 未来の予定がある状態で `/` を開く → 「次の予定」カードに日付・ポイント・「あと N 日」・持ち物進捗（例: 3 / 12）が表示される
2. 予定を全て削除して `/` を開く → 「次のダイビングを計画しよう」CTA が表示される
3. 予定日が今日の予定を作成 → 「今日」表示になる
4. 未ログインで `/` を開く → 「次の予定」セクションが表示されない（FR-006）
5. TOP の初期表示で「残り日数 + 進捗」が体感 3 秒以内に確認できる（SC-002）

### 4. アクセス制御（FR-015〜016 / SC-004）

1. 未ログインで `/plans` を開く → `/login` にリダイレクトされる
2. 別ユーザーの予定 id で `/plans/<id>` を開く → 404
3. RLS 検証（DB 直接）:

```sql
-- anon ロールで 0 件になること
set role anon;
select count(*) from public.dive_plans;
select count(*) from public.plan_packing_items;
reset role;
```

## 自動テスト

```bash
cd service-front
npx vitest run --project unit src/features/plans   # スキーマ / lib / コンポーネント
npx playwright test tests/a11y                      # /plans 系画面の WCAG 2.1 AA
```

## 期待結果サマリー

- 上記シナリオ全項目がパス
- `npx tsc --noEmit` エラー 0 / `npx biome check src/features/plans` エラー 0
- Supabase lint（`npx supabase db lint`）で `auth_rls_initplan` / `function_search_path_mutable` 警告なし
