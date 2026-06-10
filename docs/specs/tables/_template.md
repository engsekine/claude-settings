# `<schema>.<table_name>`

> このテンプレートは `docs/specs/tables/<table_name>.md` を新規作成するときの雛形。
> 不要なセクションは削除して構わないが、**メタ情報 / カラム / 制約 / RLS** は必ず残す。

## メタ情報

| 項目 | 内容 |
|------|------|
| スキーマ | `public` |
| テーブル名 | `<table_name>` |
| 説明 | 1 行サマリー |
| 主キー | `id` |
| RLS | 有効 / 無効 |
| 関連機能 | [NNN 機能名](../features/NNN-feature-name/requirements.md) |
| ステータス | ドラフト / レビュー中 / 確定 / 廃止 |

## 1. 概要

このテーブルが扱う情報、ライフサイクル、想定される行数規模、隣接テーブルとの関係などを記述する。

## 2. カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|-------|----|------|----------|------|
| `id` | `uuid` | NO | `gen_random_uuid()` | 主キー |
| `created_at` | `timestamptz` | NO | `now()` | 作成日時 |
| `updated_at` | `timestamptz` | NO | `now()` | 更新日時（トリガで自動更新） |

## 3. 制約

### 主キー

- `<table_name>_pkey`: `(id)`

### 外部キー

| 制約名 | カラム | 参照先 | ON DELETE |
|--------|------|------|----------|
| `<table_name>_<column>_fkey` | `<column>` | `<referenced_table>(id)` | `CASCADE` / `RESTRICT` / `SET NULL` |

### ユニーク制約

| 制約名 | カラム | 補足 |
|--------|------|------|
| `<table_name>_<column>_key` | `<column>` | 条件付きならコメント |

### CHECK 制約

| 制約名 | 内容 |
|--------|------|
| `<table_name>_<column>_check` | `<column> >= 0` |

## 4. インデックス

| インデックス名 | カラム | 種別 | 用途 |
|-------------|------|------|------|
| `idx_<table>_<column>` | `(<column>)` | btree | 一覧表示 |

## 5. RLS（Row Level Security）

RLS は **有効** とし、以下のポリシーを定義する。

| ポリシー名 | コマンド | 条件 |
|----------|---------|------|
| `<table_name> can <action> own row` | `SELECT` | `(select auth.uid()) = user_id` |

## 6. トリガー

| トリガー名 | タイミング | 関数 | 内容 |
|----------|----------|------|------|
| `<table_name>_handle_updated_at` | `BEFORE UPDATE` | `public.handle_updated_at()` | `updated_at` を `now()` に更新 |

## 7. ER（隣接テーブル）

```mermaid
erDiagram
  users ||--o{ <table_name> : "has many"
```

参照する側 / される側を明示する。

## 8. 運用ノート

- 想定行数 / 増加ペース
- バックアップ・アーカイブ方針
- 性能上の注意点
- 既知の制約

## 9. 関連リソース

- マイグレーション: `supabase/migrations/<timestamp>_create_<table_name>.sql`
- 型: `service-front/src/features/<feature>/types.ts`
- スキーマ: `service-front/src/features/<feature>/schemas/<schema>.ts`
- 関連機能: `specs/features/NNN-feature-name/`
- 隣接テーブル: [`other_table.md`](other_table.md)

## 10. 変更履歴

| 日付 | マイグレーション | 変更内容 |
|------|---------------|---------|
| YYYY-MM-DD | `<timestamp>_create_<table_name>.sql` | 初版作成 |
