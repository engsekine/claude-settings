# Contract: お問い合わせ送信（公開フォーム）

service-front の Server Action `submitInquiry` と DB 関数 `submit_inquiry` の境界契約。

## Server Action: `submitInquiry`

`service-front/src/features/contact/server/actions.ts`（`'use server'`）

```text
submitInquiry(input: ContactFormValues): Promise<ActionResult>
```

- `ContactFormValues`: `{ name, email, category, body, website }`（`contact.schema.ts` の `yup.InferType`）
- 戻り値は共通 `ActionResult`（`@/shared/types/action-result`）。成功 `{ success: true }` / 失敗 `{ success: false, error }`。

### 処理フロー

1. yup でサーバー側再検証。失敗 → `actionFailure(<最初のエラーメッセージ>)`。
2. **ハニーポット**: `input.website` が空でなければ、保存せず `actionSuccess()` を返す（bot をサイレントに弾く / R-003）。
3. セッション確認: `supabase.auth.getUser()` でログイン中なら `user.id` を `p_submitter_user_id` に、なければ null。
4. IP 取得: `headers()` の `x-forwarded-for` 先頭値（無ければ null）を `p_submitter_ip` に。
5. `supabase.rpc('submit_inquiry', { p_name, p_email, p_category, p_body, p_submitter_user_id, p_submitter_ip })` を呼ぶ。
6. エラーマッピング:
   - `rate_limited` → `actionFailure('送信が集中しています。しばらくおいてから再度お試しください')`
   - `duplicate` → `actionFailure('同じ内容のお問い合わせがすでに送信されています')`
   - その他 → `actionFailure('送信に失敗しました。時間をおいて再度お試しください')`（FR-009）
   - 成功 → `actionSuccess()`

### 受付/失敗の UI 契約（`ContactForm`）

| 状態 | 表示 |
|---|---|
| 送信中 | 送信ボタン無効化（`isPending`）・二重送信防止（FR-014a） |
| 成功 | `role="status"`（暗黙で `aria-live="polite"`）で受付完了メッセージ。入力値をクリア（reset）（FR-008） |
| 失敗 | `role="alert"` でエラーメッセージ（FR-009） |
| バリデーション不備 | 各項目に `aria-invalid` + `role="alert"` のフィールドエラー（FR-003〜005） |

## DB 関数: `public.submit_inquiry`

詳細は [data-model.md](../data-model.md#関数-publicsubmit_inquiry) を参照。

| 入力 | 型 | 必須 |
|---|---|---|
| `p_name` | text | ○ |
| `p_email` | text | ○ |
| `p_category` | text | ○（4 値） |
| `p_body` | text | ○（1–1,000） |
| `p_submitter_user_id` | uuid | 任意（null 可） |
| `p_submitter_ip` | inet | 任意（null 可） |

| 例外（SQLSTATE/メッセージ） | 意味 |
|---|---|
| `rate_limited` | 同一 IP 直近 60 秒で 3 件以上 |
| `duplicate` | 同一 IP + 同一本文が直近 5 分以内 |
| 検証エラー | 種別/本文長/氏名長/メール長が範囲外 |

- 権限: `grant execute on function public.submit_inquiry(...) to anon, authenticated;`
- 戻り値: 作成された `inquiries.id`（uuid）。
