# Contract: 監査ログ（admin-audit）

管理画面の全データ変更を `admin_audit_logs` に記録し、参照する契約（US5 / FR-018）。記録は admin-resource の各 mutation 内から呼ばれ、**記録漏れを起こさない**ことが要件。

## 記録ユーティリティ（`shared/lib/audit/recordAudit.ts`）

```ts
export interface AuditEntry {
  action: 'create' | 'update' | 'soft_delete' | 'hard_delete' | 'restore';
  targetTable: string;
  targetId: string;
  changes?: Record<string, unknown> | null; // before/after の要約。個人情報は最小限
}
export const recordAudit = async (entry: AuditEntry): Promise<void> => {
  // requireAdmin() で得た actor の id を actor_id に設定して insert
  // 失敗時は mutation 全体を失敗扱いにする（監査なしの変更を残さない）
};
```

- `actor_id` はサーバー側で `auth.uid()` から解決（クライアント指定を信頼しない）。RLS の insert ポリシーでも `actor_id = (select auth.uid())` を強制。
- `changes` は差分の要約のみ。パスワード等の機微情報は記録しない（FR / Edge Case: 過剰な情報露出の抑制）。
- 監査ログ自体は更新・削除不可（RLS でポリシー未定義 = deny）。追記専用。

## 参照（queries.ts / US5）

### `listAuditLogs(params): Promise<ResourceListResult<AuditLogRow>>`

- 時系列（`created_at desc`）でページング表示。実行者・対象テーブル・対象 ID・操作種別・日時を含む。
- フィルタ: `actor_id` / `target_table` / `action` / 期間。
- 表示は join で `admin_users.display_name` を補完。

## 受け入れ基準

- 任意の create / update / soft_delete / hard_delete / restore 後、対応する 1 行が `admin_audit_logs` に記録される。
- 操作ログ一覧で「実行者・対象・操作種別・日時」が時系列で確認できる。
- 監査 insert が失敗した場合、元の mutation も失敗（または同一トランザクションでロールバック）し、記録のない変更が残らない。
- 監査ログの更新・削除が RLS で拒否される（単体テスト）。
