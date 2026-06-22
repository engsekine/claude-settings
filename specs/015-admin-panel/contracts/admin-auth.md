# Contract: 管理者認証・権限ゲート（admin-auth）

admin-front のログイン / ログアウト / 権限判定の契約。すべて `ActionResult<T>`（`@/shared/types/action-result` 相当）で統一し、Server Action は認証チェックを必ず行う（Constitution / feature-based データ層規約）。

## Server Actions（`features/admin-auth/server/actions.ts`）

### `signInAdmin(email, password): Promise<ActionResult>`

- Supabase Auth で `signInWithPassword`。成功後 `is_admin()` 相当（`admin_users` に有効行あり）を確認。
- **管理者でない場合**: 直ちに `signOut` し `actionFailure('管理者権限がありません')` を返す（一般ユーザーのセッションを admin-front に残さない）。
- 成功時は `(admin)` ルートグループのトップ（ダッシュボード `/`）へ `redirect`。
- 失敗時メッセージは認証情報を区別しない（`メールアドレスまたはパスワードが間違っています`）。

### `signOutAdmin(): Promise<void>`

- `supabase.auth.signOut()` 後 `/login` へ `redirect`。以降は全 `(admin)` URL にアクセス不可（FR-004）。

## 権限ゲート（多層防御 / SC-001）

### 一次ガード: `proxy.ts`（middleware 相当）

| 状態 | `(admin)` 配下へのアクセス | `/login` へのアクセス |
|---|---|---|
| 未認証（admin Cookie なし） | `/login` へリダイレクト | 通過 |
| 認証済み（admin セッションあり） | 通過 | `/`（ダッシュボード）へ |

- 一次ガードは `updateSession` で得た `user`（= admin 専用 Cookie `sb-divelog-admin-auth-token` のセッション）の有無のみで判定する。admin-front は専用 Cookie を使い、`signInAdmin` が認証成功後に非管理者を即サインアウトするため、**admin-front のセッションを持つ = 管理者**という前提が成立する。
- 「認証済みだが非管理者」を弾く最終判定は `signInAdmin`（ログイン時）と、全 `(admin)` 配下の `requireAdmin()`（二次ガード）+ RLS（三次）で多層に担保する。middleware で毎リクエスト `admin_users` を照会する DB 往復は避ける設計。
- matcher は静的アセットを除外（service-front の `proxy.ts` 同様）。

### 二次ガード: queries / actions

- すべての admin queries.ts / actions.ts の冒頭で `requireAdmin()` を呼ぶ。
- `requireAdmin(): Promise<AdminUser>` — 未認証 / 非管理者なら throw（→ `error.tsx` / redirect）。RLS（`is_admin()` ポリシー）と合わせて二重に担保。

```ts
// features/admin-auth/server/guard.ts（契約イメージ）
export interface AdminUser { id: string; displayName: string; role: 'admin' | 'superadmin'; }
export const requireAdmin = async (): Promise<AdminUser> => { /* getUser → admin_users 照会 → 失敗で throw */ };
```

## 受け入れ基準（US1）

- 管理者の正しいログイン → ダッシュボード遷移。
- 非管理者の `(admin)` URL 直打ち → 内容を出さずアクセス拒否。
- 未認証の任意 URL → `/login` 誘導。
- ログアウト後 → 全 `(admin)` URL にアクセス不可。
- RLS 単体テスト: 非管理者セッションで管理対象テーブルへ select/update/delete が 0 件 / 拒否になること。
