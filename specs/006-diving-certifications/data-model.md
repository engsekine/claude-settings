# Data Model: `public.certifications`

## メタ情報

| 項目 | 内容 |
|------|------|
| スキーマ | `public` |
| テーブル名 | `certifications` |
| 説明 | ユーザーが保有するダイビングライセンス資格 |
| 主キー | `id` |
| RLS | 有効 |
| 関連機能 | [006 ダイビングライセンス保有資格管理](spec.md) |
| ステータス | 確定 |

## 1. 概要

ユーザーが取得したダイビングライセンス資格 1 件を 1 行で保持するテーブル。1 ユーザーが複数の資格を持つ 1:N 関係（OW → AOW → Rescue のような段階取得が一般的なため）。

保有期間（取得日からの経過年月）は導出値のためカラムに持たない（[research.md R3](research.md) 参照）。

## 2. カラム定義

| カラム | 型 | NULL | デフォルト | 説明 |
|-------|----|------|----------|------|
| `id` | `uuid` | NO | `gen_random_uuid()` | 主キー |
| `user_id` | `uuid` | NO | — | 所有ユーザー。`users(id)` を参照。`on delete cascade` |
| `agency` | `text` | NO | — | 指導団体。`padi` / `naui` / `ssi` / `bsac` / `cmas` / `other` の 6 値（CHECK 制約） |
| `rank` | `text` | NO | — | 資格ランク名（自由入力）。trim 後 1 文字以上・60 文字以内 |
| `acquired_on` | `date` | NO | — | 資格取得日。1900-01-01 〜 当日。「当日」はユーザーのローカル日付基準で yup / Server Action が検証し、DB CHECK は UTC とのズレを許容する安全網（`current_date + 1` まで） |
| `created_at` | `timestamptz` | NO | `now()` | 作成日時 |
| `updated_at` | `timestamptz` | NO | `now()` | 更新日時（トリガで自動更新） |

### バリデーション（DB 制約に乗らないもの）

| ルール | 実装場所 | 理由 |
|--------|---------|------|
| `acquired_on` ≦ 当日（ユーザーのローカル日付基準） | yup + Server Action | DB の `current_date` は UTC 基準のため、JST の午前中に「今日」を登録すると正当な入力が弾かれうる。厳密な未来日付拒否はアプリ層で行い、DB CHECK は `current_date + 1` の安全網とする |
| `acquired_on` ≧ `user_details.birth_on` | Server Action | クロステーブル参照のため CHECK 制約にできない（[research.md R4](research.md)）。`user_details` が取得できない場合は登録・更新を拒否してエラー表示する |
| 重複登録時のユーザー向けエラーメッセージ | Server Action | 一意制約違反（23505）を捕捉して変換（[research.md R5](research.md)） |

## 3. 制約・インデックス

| 名前 | 種別 | 定義 |
|------|------|------|
| `certifications_pkey` | 主キー | `(id)` |
| `certifications_user_id_fkey` | 外部キー | `user_id references public.users(id) on delete cascade` |
| `certifications_user_id_agency_rank_key` | ユニーク | `(user_id, agency, rank)` — 同一団体・同一ランクの重複登録防止 |
| `certifications_agency_check` | CHECK | `agency in ('padi', 'naui', 'ssi', 'bsac', 'cmas', 'other')` |
| `certifications_rank_check` | CHECK | `length(trim(rank)) > 0 and char_length(rank) <= 60` |
| `certifications_acquired_on_check` | CHECK | `acquired_on >= '1900-01-01' and acquired_on <= current_date + 1`（+1 はタイムゾーン差の許容。厳密な当日判定はアプリ層） |
| `idx_certifications_user_id_acquired_on` | インデックス | `(user_id, acquired_on desc)` — 一覧の取得日降順表示用。同日取得は `created_at desc` を第 2 ソートキーとする（クエリ側で指定） |

## 4. RLS ポリシー

`alter table public.certifications enable row level security;` のうえで、本人のみ全操作可:

| ポリシー名 | 操作 | 条件 |
|-----------|------|------|
| `"users can read own certifications"` | select | `using ((select auth.uid()) = user_id)` |
| `"users can insert own certifications"` | insert | `with check ((select auth.uid()) = user_id)` |
| `"users can update own certifications"` | update | `using` + `with check` 両方で `(select auth.uid()) = user_id` |
| `"users can delete own certifications"` | delete | `using ((select auth.uid()) = user_id)` |

## 5. トリガ

| トリガ名 | タイミング | 内容 |
|---------|----------|------|
| `certifications_handle_updated_at` | `before update` | `public.handle_updated_at()`（users マイグレーションで定義済み）で `updated_at` を自動更新 |

## 6. マイグレーションファイル

```
supabase/migrations/<timestamp>_create_certifications.sql
```

- テーブル作成・コメント・ユニーク制約・インデックス・RLS ポリシー・トリガを 1 ファイルにまとめる（強い依存関係があるため 1 マイグレーション 1 目的の範囲内）
- `comment on` でテーブル・主要カラムの意図を記録する

## 7. 導出値: 保有期間

| 項目 | 内容 |
|------|------|
| 定義 | `acquired_on` から現在日までの経過年月（月数は切り捨て） |
| 実装 | `features/certifications/lib/heldPeriod.ts` の純粋関数。DB には保存しない |
| 表示例 | 「3年2ヶ月」「11ヶ月」「0ヶ月」（取得当日） |
| 境界 | 月末またぎ（1/31 取得 → 2/28 時点）は「日が足りなければ 1 ヶ月未満」として切り捨て |
