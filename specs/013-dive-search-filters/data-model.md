# Data Model: ダイブログ検索・フィルタ強化

**Feature**: 013-dive-search-filters | **Date**: 2026-06-18

## スキーマ変更

**なし。** 本機能は既存 `dives` テーブルのカラムで絞り込むのみで、テーブル・カラム・RLS・マイグレーションの追加は行わない。

## 参照する既存カラム（`public.dives`）

| カラム | 型 | フィルタ用途 | 備考 |
|---|---|---|---|
| `dive_number` | integer | 番号一致（既存） | `eq` |
| `dive_date` | date | 期間（開始〜終了） | `gte` / `lte`（両端含む）。旧・単一日付フィルタを置換 |
| `max_depth_m` | numeric | 深度範囲（下限〜上限） | `gte` / `lte`。下限・上限のいずれか指定時は NULL を除外（FR-002） |
| `dive_type` | text | ダイブタイプ一致 | `eq`。値は `DIVE_TYPE_OPTIONS` の value |
| `location` | text | ポイント名（既存） | 自由入力名 + 参照サイト名の OR（011 で実装済み） |
| `dive_site_id` | uuid | ポイント名（既存） | サイト名一致時の合流に使用 |

アクセス制御は既存の本人限定 RLS（`(select auth.uid()) = user_id`）に従い、絞り込み対象は常に本人のログのみ。

## 導出状態: 検索フィルタ（`DiveListFilter`）

DB に保存しない、URL クエリで表現する導出的な状態。

| フィールド | 型 | 由来 URL パラメータ | 制約 |
|---|---|---|---|
| `diveNumber` | `number?` | `number` | 0〜9999 の整数 |
| `dateFrom` | `string?` | `date_from` | `YYYY-MM-DD` |
| `dateTo` | `string?` | `date_to` | `YYYY-MM-DD`、`dateTo >= dateFrom` |
| `depthMin` | `number?` | `depth_min` | 0〜300 |
| `depthMax` | `number?` | `depth_max` | 0〜300、`depthMax >= depthMin` |
| `diveType` | `string?` | `type` | `DIVE_TYPE_OPTIONS` の value のいずれか |
| `location` | `string?` | `q` | 120 文字以内 |

### バリデーション規則（`diveSearchSchema`）

- 範囲の相互制約: `dateTo >= dateFrom`、`depthMax >= depthMin`。違反時は検索を実行せずフィールドエラー（FR-006）
- 片側のみの指定は「以上 / 以下」の開いた範囲として許容
- 空（全項目未指定）は全件表示（FR-007）
- `diveType` は列挙外の値を受け付けない（`oneOf`）

### 組み合わせ規則

- すべてのフィルタは AND で合成（FR-005）
- フィルタは `useDives` の react-query キー（`['dives', filter]`）に含まれ、追加読み込み（ページネーション）を越えて維持される（FR-009）

## 状態遷移

フィルタは画面操作で更新される導出状態であり、永続的なライフサイクルは持たない:

```text
URL クエリ ──parse──▶ DiveListFilter ──query──▶ 一覧結果
   ▲                        │
   └──────serialize─────────┘   （検索 / クリア操作で URL を replace）
```
