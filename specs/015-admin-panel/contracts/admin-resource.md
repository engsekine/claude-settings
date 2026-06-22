# Contract: リソース管理（一覧 / 詳細 / 作成 / 編集 / 削除）

特化画面（users / dives / dive-sites）と汎用テーブルエディタが共有する、管理対象リソース操作の契約。一覧取得は queries.ts（Server Components）、変更は Server Actions（`ActionResult<T>`）。全関数は冒頭で `requireAdmin()`（admin-auth contract）を呼ぶ。

## 一覧取得（queries.ts / US2・FR-006〜009・SC-004）

### `listResource(params): Promise<ResourceListResult<Row>>`

```ts
export interface ResourceListParams {
  page: number;          // 1 始まり
  perPage: number;       // 既定 20
  search?: string;       // キーワード（対象カラムは feature ごとに定義。実装は PostgREST 特殊文字を除去してから ilike 検索）
  sort?: { column: string; ascending: boolean }; // column は許可リスト内のみ適用
  includeDeleted?: boolean; // 既定 false（deleted_at is null のみ）
}
export interface ResourceListResult<Row> {
  rows: Row[];
  total: number;         // 総件数（ページャ表示用）
  page: number;
  perPage: number;
}
```

- **サーバーページング必須**（`range()` + count）。`select *` 禁止、一覧表示に必要なカラムのみ。
- 検索・並び替えは DB 側で実行。並び替えカラムは許可リストで限定（任意カラム injection 防止）。
- 0 件でも `rows: []` / `total: 0` を返す（UI は EmptyState 表示、FR-009）。
- Supabase エラーは throw（error.tsx に委譲）。「データなし」は空配列であり 404 ではない。

### `getResourceDetail(id): Promise<Detail | null>`

- 1 件の全項目 + 関連サマリ（例: ユーザー詳細にダイブログ件数）を返す。
- 該当なしは `null`（→ `notFound()`）。

## 変更（actions.ts / US3・FR-010〜016）

すべて成功時に `revalidatePath` で一覧・詳細を更新し、**監査ログを記録**（admin-audit contract）。

### `createResource(table, input): Promise<ActionResult<{ id: string }>>`

- 入力をサーバー側で再検証（必須・形式・文字数・選択肢・参照整合性 / FR-012）。違反時は保存せず `actionFailure` にどの項目が不正かを含める。
- 監査: `action: 'create'`。

### `updateResource(table, id, input): Promise<ActionResult>`

- 同上の検証。永続化後、一覧・詳細へ反映（FR-010）。
- 監査: `action: 'update'`, `changes`（before/after 要約）。
- 同時編集の競合（Edge Case）: `updated_at` を楽観ロックに用い、ズレ検知時は `actionFailure('他の管理者が更新しました。再読み込みしてください')`。

### `softDeleteResource(table, id): Promise<ActionResult>` / `restoreResource(...)`

- `deleted_at = now()` を設定（既定の削除 / FR-013）。`restore` は `deleted_at = null`。
- 監査: `action: 'soft_delete'` / `'restore'`。
- UI は実行前に `ConfirmDialog` を必須通過（SC-006）。

### `hardDeleteResource(table, id): Promise<ActionResult>`

- 物理削除（限定利用）。**参照整合性チェック（FR-014）**: 他テーブルから参照されている場合は**削除をブロック**し、`actionFailure` で参照件数を提示する（連鎖削除・参照解除による利用者データの巻き込みは行わない）。
- 監査: `action: 'hard_delete'`。確認 UI 必須。

## 汎用テーブルエディタ（FR-017 / R3）

- 編集可能テーブル・カラムは**許可リスト**で限定。型・NOT NULL・CHECK を生成型（`Database['public']['Tables']`）から導出してフォーム生成・検証する。
- `auth` スキーマ・内部カラム・個人情報の過剰露出を抑制（Edge Case / FR-003）。

## バリデーション規約

- フォームは React Hook Form + yup（`schemas/*.schema.ts`）。サーバー側でも同等の検証を再実行（クライアント検証を信頼しない）。
- 数値の string 化は `toNumber` 相当で吸収。row 型は生成型を使用（手書き禁止）。

## 受け入れ基準（US2 / US3）

- メニュー選択 → 一覧（ページング）→ 検索（件数表示）→ 詳細表示が成立。
- 作成 → 一覧反映、編集 → 反映、ソフトデリート → 一覧から除外、復元 → 復帰。
- 制約違反時は保存されず不正項目が示される。
- 参照されているマスタの物理削除はブロックされ、参照件数が提示される。
- 数万件規模でも一覧・検索が約 2 秒以内（SC-004）。
