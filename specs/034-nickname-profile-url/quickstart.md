# Quickstart: プロフィール URL のニックネーム化（034-nickname-profile-url）

実装完了後に機能が end-to-end で動くことを検証する手順。契約は [contracts/routes-and-resolution.md](contracts/routes-and-resolution.md) を参照。

## 前提

```bash
npx supabase start && npx supabase db reset   # seed: test@example.com（nickname: たろう 等）/ buddy@example.com（buddy-taro）
npm run dev --workspace service-front         # http://localhost:3000
```

## シナリオ 1: ニックネーム URL と導線（US1）

1. `test@example.com` でログイン → ヘッダーのユーザーメニューからマイプロフィールを開く
2. **期待**: URL が `/users/<自分のニックネーム>`（日本語はエンコード表示でも可）になり、プロフィールが表示される
3. タイムライン・フォロワー一覧・ログのバディ表示・ユーザー検索結果から他ユーザーを開く → **期待**: いずれもニックネーム URL で遷移する
4. `/users/<ニックネーム>/followers`・`/following` → **期待**: ニックネーム基準の URL で表示される
5. 存在しないニックネーム（例: `/users/no-such-user-xyz`）→ **期待**: 404
6. 大文字小文字違い（例: buddy-taro に対して `/users/BUDDY-TARO`）→ **期待**: 同一ユーザーに解決される（FR-002）

## シナリオ 2: ID 形式 URL の互換（US2）

1. buddy ユーザーの user_id を控え、`/users/<uuid>` にアクセス
2. **期待**: `/users/buddy-taro` へ転送され、同じプロフィールが表示される
3. `/users/<uuid>/followers` → **期待**: `/users/buddy-taro/followers` へ転送
4. 存在しない uuid → **期待**: 404

## シナリオ 3: ニックネーム変更（US3）

1. アカウント設定でニックネームを `taro-2` に変更する
2. **期待**: マイプロフィールの URL が 5 秒以内に `/users/taro-2` になる（SC-004）
3. 旧ニックネームの URL にアクセス → **期待**: 404（誰も使っていないため）
4. ID 形式 URL にアクセス → **期待**: `/users/taro-2` へ転送（ID 経由は変更に影響されない）

## シナリオ 4: 登録制約とフォールバック（FR-005/006）

1. アカウント設定でニックネームを `search` / uuid 形式 / `a/b` に変更しようとする → **期待**: いずれもバリデーションエラーで拒否される
2. （既存データ想定の確認）DB 上に URL 不可ニックネームのユーザーがいる場合: そのユーザーへのアプリ内リンクが ID 形式になり、ID URL でプロフィールに到達できる（SC-003）

## シナリオ 5: 退行確認

1. `/users/search` のユーザー検索が従来どおり動作する
2. プロフィールの表示内容・フォローボタンの挙動が変わっていない（FR-009）
3. 通知（フォローされました）からの遷移がニックネーム URL で正しいユーザーに届く

## 自動テスト

```bash
cd service-front && npx vitest run --project unit   # profile-path / schema / 解決まわり
npx playwright test tests/profile-url.spec.ts       # シナリオ 1〜3・5 相当
```
