# 001 認証 - タスク

## 前提

- `service-front` に既存の `features/auth` 雛形あり（要確認）
- `@repo/supabase` 利用可能
- Supabase ローカル環境が起動できる

## タスク

### 調査

- [x] T1: 既存 `features/auth` の現状を確認し不足を洗い出す

### スキーマ・Server Actions

- [x] T2: yup スキーマ作成（login / signup / reset）
- [x] T3: Server Actions 実装（signIn / signUp / signOut / requestPasswordReset）

### ページ

- [x] T4: `/login` ページ実装
- [x] T5: `/signup` ページ実装
- [x] T6: `/reset-password` ページ実装
- [ ] T7: パスワード再設定（リンクから飛ぶページ） — 後続で対応

### 認証ガード

- [x] T8: `middleware.ts` で `(app)` 配下を保護
- [x] T9: 認証済みユーザーが `(auth)` 配下に来たら `/dives` へリダイレクト
- [x] T10: `api/auth/callback/route.ts` 実装

### UI

- [x] T11: ヘッダーにログアウトボタン（既存 `AuthNav` で実装済み）

### テスト

- [ ] T12: yup スキーマ単体テスト
- [ ] T13: Server Actions 単体テスト
- [ ] T14: E2E テスト（サインアップ → ログイン → ログアウト → リセット）

## 受け入れ確認

- [ ] requirements.md の全受け入れ条件を Playwright で再現
- [ ] 未認証で `/dives` にアクセス → `/login` リダイレクト
- [ ] 認証済みで `/login` にアクセス → `/dives` リダイレクト
- [ ] パスワードリセットメールが Inbucket（ローカル）に届く
