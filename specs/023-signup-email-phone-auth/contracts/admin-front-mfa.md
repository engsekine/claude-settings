# Contract: 管理者による 2 要素認証の解除（admin-front / FR-016）

電話紛失・番号変更時のリカバリー。既存 `admin-front/src/features/users-admin/` に追加する。Supabase Admin API（service_role 必須）を使うため、サービスロールクライアントを新設する。

## サービスロールクライアント（新規）

- **Path**: `admin-front/src/shared/lib/supabase/admin.ts`（`server-only`）
- **中身**: `createClient<Database>(url, SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } })`。
- **制約**: クライアントバンドルへ絶対に含めない。`requireAdmin()` を通過したサーバーアクション内でのみ import・使用する。

## removeMfaFactor

```
removeMfaFactor(userId: string): Promise<ActionResult>
```

- **ガード**: 先頭で `requireAdmin()`（未認証/非管理者はリダイレクト）。
- **処理**:
  1. `adminClient.auth.admin.mfa.listFactors({ userId })` で対象ユーザーの要素一覧を取得。
  2. phone 要素すべてを `adminClient.auth.admin.mfa.deleteFactor({ id, userId })` で削除。
  3. `recordAudit({ action: 'mfa_factor_removed', targetUserId: userId, actorAdminId })` で監査記録。
- **結果**: 成功で `{ ok: true }`。以後、対象ユーザーは 2 段階目なしでログインでき、必要なら再登録できる（FR-016）。
- **失敗**: 対象なし/削除失敗は `{ ok: false, message }`。

## getUserMfaStatus（任意）

```
getUserMfaStatus(userId: string): Promise<{ enabled: boolean, phoneMasked?: string }>
```

- ユーザー詳細で「2 要素認証: 有効/無効」を表示し、解除ボタンの出し分けに使う。`listFactors` から判定。

## UI

- `admin-front/src/app/(admin)/users/[id]/`（ユーザー詳細）に「2 要素認証を解除」ボタン。
- 破壊的操作のため確認ダイアログ + 実行結果の通知（`role="status"`/`role="alert"`）。
- 有効な要素が無いユーザーではボタンを非活性/非表示。

## セキュリティ

- service_role キーはサーバー専用。監査必須。Constitution IV に準拠。
