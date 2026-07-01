# Contract: SMS 2 要素認証（service-front / US2）

新規 `service-front/src/features/mfa/`。MFA の enroll/challenge/verify/disable と、ログイン 2 段階目のチャレンジを担う。Supabase の MFA API は認証済みクライアント（ブラウザ/サーバー）で呼ぶ。操作系はクライアントの `supabase.auth.mfa.*` を使う Client Component + 補助サーバーアクションで構成する（実装時に client/server 分担を確定）。

## 有効化（設定画面）

### enrollPhoneFactor

```
enrollPhoneFactor(phone: string): Promise<{ factorId, challengeId } | ActionError>
```

- **目的**: 電話番号を登録し確認コードを送信（FR-008/009）。
- **処理**: `mfa.enroll({ factorType: 'phone', phone })` → 返った `factorId` で `mfa.challenge({ factorId })`（SMS 送信）。
- **検証**: `phone` は E.164 形式・必須。不正形式は拒否（Edge Case）。
- **失敗**: 既に有効な要素がある場合はその旨、レート制限時は再送待ちメッセージ。

### verifyPhoneFactor

```
verifyPhoneFactor(factorId: string, challengeId: string, code: string): Promise<ActionResult>
```

- **処理**: `mfa.verify({ factorId, challengeId, code })`。成功で要素が `verified`＝2FA 有効化（FR-009）。
- **失敗**: 誤コード/期限切れは拒否して再入力（FR-011 相当）。

### disablePhoneFactor

```
disablePhoneFactor(factorId: string): Promise<ActionResult>
```

- **処理**: `mfa.unenroll({ factorId })`（FR-014）。以後 2 段階目を求めない。

### getMfaStatus

```
getMfaStatus(): Promise<{ enabled: boolean, factorId?: string, phoneMasked?: string }>
```

- 設定画面の初期表示用。`mfa.listFactors()` から phone factor を判定。

## ログイン 2 段階目（チャレンジ）

### challengeLoginFactor / verifyLogin

```
challengeLoginFactor(factorId: string): Promise<{ challengeId } | ActionError>   // SMS 再送含む（FR-012）
verifyLogin(factorId: string, challengeId: string, code: string): Promise<ActionResult>  // 成功で AAL2 昇格 → /dives
```

- **フロー**: 1 段階目（`signIn`/Google）成功後、`getAuthenticatorAssuranceLevel()` が `aal1→aal2` の場合に 2 段階目 UI を表示。`challenge` で SMS 送信、`verify` で昇格し `/dives`（FR-010/011）。
- **再送**: `challengeLoginFactor` の再呼び出し（クールダウン + `max_frequency`、FR-013）。

## ルートガード（AAL2 強制）

- `service-front/src/proxy.ts` と `app/(authenticated)/layout.tsx` に AAL 判定を追加:
  - `nextLevel==='aal2' && currentLevel==='aal1'` → 保護ルートを遮断し 2 段階目チャレンジ画面へ。
  - 2 段階目未完了で離脱してもセッションは AAL1 のまま保護コンテンツに入れない（Edge Case / FR-010）。
- 2FA 未有効化ユーザー（`nextLevel==='aal1'`）は一切変化しない（FR-015）。

## 受け入れ対応

- US2 Acceptance 1〜6 を網羅。

## 型・エラー方針

- `ActionResult` / `ActionError` は既存 auth アクションの返却型に合わせる（`any` 禁止）。ユーザー向けメッセージは日本語。
