# Data Model: ダイビング申し込みシートのテキスト出力

**Date**: 2026-07-10 | **Feature**: [spec.md](./spec.md) | **Design**: [research.md](./research.md) Decision 2

## 新規テーブル: `public.application_profiles`

ユーザー 1 人につき 1 件（users と 1:1）。申し込みシートの再利用用に、既存データから導出できない個人属性のみを保持する（FR-010）。レンタル品目の選択・省略トグルは保存しない（Clarifications 参照）。

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| `user_id` | `uuid` | PK, `references public.users(id) on delete cascade` | 本人に帰属 |
| `phone` | `text` | `not null default ''`, `char_length <= 20` | 携帯電話番号（ハイフン任意の自由入力） |
| `emergency_contact_relation` | `text` | `not null default ''`, `char_length <= 40` | 緊急連絡先の続柄（例: 父・妻） |
| `emergency_contact_phone` | `text` | `not null default ''`, `char_length <= 20` | 緊急連絡先の電話番号 |
| `nearest_station` | `text` | `not null default ''`, `char_length <= 100` | 最寄りの駅 |
| `foot_size_cm` | `numeric(4, 1)` | nullable, `> 0 and <= 50` | 足のサイズ（cm）。スーツレンタル時に使用 |
| `has_izu_chiba_experience` | `boolean` | nullable | 伊豆・千葉での経験。null = 未入力 |
| `has_boat_experience` | `boolean` | nullable | ボートダイビング経験。null = 未入力 |
| `has_dry_suit_experience` | `boolean` | nullable | ドライスーツ経験。null = 未入力 |
| `dry_suit_dive_count` | `integer` | nullable, `>= 0` | ドライスーツの経験本数（約） |
| `has_contact_lens` | `boolean` | nullable | コンタクトレンズの有無。null = 未入力 |
| `contact_lens_type` | `text` | nullable, `check in ('hard', 'soft', 'disposable')` | コンタクトの種類。有りの場合のみ意味を持つ |
| `needs_prescription_mask` | `boolean` | nullable | 度付きマスクレンタルの要否。null = 未入力 |
| `created_at` | `timestamptz` | `not null default now()` | |
| `updated_at` | `timestamptz` | `not null default now()`（トリガで自動更新） | |

### 設計メモ

- **氏名・生年月日・性別・身長・体重は保持しない**: `user_details` に既存のため参照のみ（正規化: 同一事実の二重保存を避ける）。フォーム上での修正は出力テキストにのみ反映し、DB には書き戻さない
- **経験系 boolean は nullable**: 「未入力（空欄で出力）」と「無」を区別するため
- **最終ダイブ年月・経験本数・ライセンスランクは保持しない**: `dives` / `certifications` から導出（上書き値は出力のみに反映）
- **`updated_at` トリガ**: 既存の `public.handle_updated_at()` を再利用する

## RLS ポリシー

```sql
alter table public.application_profiles enable row level security;

create policy "users can read own application profile"
    on public.application_profiles for select
    using ((select auth.uid()) = user_id);

create policy "users can insert own application profile"
    on public.application_profiles for insert
    with check ((select auth.uid()) = user_id);

create policy "users can update own application profile"
    on public.application_profiles for update
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
```

- delete ポリシーは定義しない（v1 に削除 UI なし。アカウント削除時は FK cascade で消える）

## マイグレーション

- ファイル: `supabase/migrations/<YYYYMMDDHHMMSS>_create_application_profiles.sql`
- 1 マイグレーション 1 目的（テーブル + RLS + トリガ + comment を同一ファイルに含める。強い依存関係のため同一ファイルで OK）
- `comment on table / column` で意図を記載する

## 参照する既存テーブル（変更なし）

| テーブル | 参照カラム | 用途 |
|---|---|---|
| `user_details` | `last_name`, `first_name`, `birth_on`, `gender`, `height_cm`, `weight_kg` | 自動入力（FR-007） |
| `certifications` | `rank`（取得日降順の先頭） | ライセンスランクの自動入力 |
| `dives` | `count(*)`, `max(dive_date)` | 経験本数・最終ダイブ年月の自動入力 |
