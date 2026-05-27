# 001 認証 - 設計

## 1. 技術選定

- **認証基盤**: Supabase Auth
- **クライアント**: `@repo/supabase` の `createClient`（browser / server / middleware）

## 2. ルート構成

```
src/app/
├── (auth)/                       # 認証グループ（未認証で閲覧可、認証済みは弾く）
│   ├── login/page.tsx
│   ├── signup/page.tsx
│   └── reset-password/page.tsx
├── (app)/                        # 認証必須グループ
│   └── dives/...
└── api/auth/
    ├── callback/route.ts         # メール認証 / OAuth コールバック
    └── signout/route.ts
```

## 3. ミドルウェア

`src/middleware.ts` で `(app)` 配下を保護する。

```ts
// 擬似コード
export async function middleware(request: NextRequest) {
  const { user } = await getUser(request)

  const isAppRoute = request.nextUrl.pathname.startsWith('/dives')
  const isAuthRoute = ['/login', '/signup'].includes(request.nextUrl.pathname)

  if (isAppRoute && !user) return NextResponse.redirect(new URL('/login', request.url))
  if (isAuthRoute && user) return NextResponse.redirect(new URL('/dives', request.url))
  return NextResponse.next()
}
```

## 4. feature 構成

```
src/features/auth/
├── components/
│   ├── LoginForm.tsx
│   ├── SignupForm.tsx
│   └── ResetPasswordForm.tsx
├── hooks/
│   └── useAuth.ts
├── server/
│   └── actions.ts                # Server Actions（signIn / signUp / signOut / resetPassword）
├── schemas/
│   ├── login.schema.ts
│   ├── signup.schema.ts
│   └── reset.schema.ts
└── types.ts
```

## 5. yup スキーマ例

```ts
// signup.schema.ts
export const signupSchema = yup.object({
  email: yup.string().email().required(),
  password: yup.string().min(6).required(),
  passwordConfirm: yup
    .string()
    .oneOf([yup.ref('password')], 'パスワードが一致しません')
    .required(),
})
```

## 6. Server Actions の責務

| Action | 役割 |
|--------|------|
| `signIn(email, password)` | Supabase でログイン → セッション cookie 設定 |
| `signUp(email, password)` | Supabase でユーザー作成 → 確認メール送信（`emailRedirectTo` で `/api/auth/callback?next=/dives` を指定） |
| `signOut()` | セッション破棄 |
| `requestPasswordReset(email)` | リセットメール送信 |

### サインアップのメール確認フロー

1. ユーザーが `/signup` でフォーム送信
2. `signUp` Server Action が `supabase.auth.signUp({ email, password, options: { emailRedirectTo } })` を呼ぶ
3. Supabase が確認メールを送信し、レスポンスは `session = null` で返る
4. SignupForm はレスポンスの `needsEmailConfirmation` を見て「確認メールを送信しました」表示に切り替え
5. ユーザーがメール内リンク（`{site_url}/api/auth/callback?code=...&next=/dives`）をクリック
6. callback route が `exchangeCodeForSession(code)` でセッション cookie を発行
7. `/dives` にリダイレクト

ローカル開発時は Inbucket（`http://127.0.0.1:54324`）でメールを確認できる（`supabase/config.toml` の `[inbucket]` 参照）。

Supabase の `enable_confirmations = true` が前提（`supabase/config.toml` 参照）。

## 7. アクセシビリティ

- ラベルと input を `htmlFor` / `id` で関連付ける
- エラーメッセージは `aria-describedby` で input に結ぶ
- 必須フィールドは `aria-required="true"`
- 送信ボタンには `aria-busy` でローディング状態を伝える

## 8. セキュリティ

- パスワードは Supabase Auth が bcrypt でハッシュ化
- セッションは httpOnly cookie
- CSRF: Next.js Server Actions の保護に従う
- レート制限: Supabase 側の `auth.rate_limit` に従う
