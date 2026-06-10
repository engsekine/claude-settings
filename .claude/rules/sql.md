# SQL コーディング規約

## 基本方針

- PostgreSQL / Supabase を前提とする
- スキーマ変更は **マイグレーション SQL ファイル** で管理し、本番 DB に対する直接の DDL 実行は禁止
- 命名は **snake_case** で統一する（テーブル・カラム・インデックス・制約・関数すべて）
- 予約語（`user`, `order` 等）はテーブル名・カラム名に使わない

## 命名規則

| 対象 | 規則 | 例 |
|------|------|----|
| テーブル | snake_case・複数形 | `users`, `dive_logs` |
| カラム | snake_case・単数形 | `email`, `created_at` |
| 主キー | `id` | `id uuid primary key` |
| 外部キー | `<参照先テーブル単数形>_id` | `user_id`, `dive_log_id` |
| 真偽値カラム | `is_*` / `has_*` プレフィックス | `is_active`, `has_certification` |
| タイムスタンプ | `*_at` サフィックス | `created_at`, `published_at`, `deleted_at` |
| 日付 | `*_on` または `*_date` サフィックス | `birth_on`, `dive_date` |
| インデックス | `idx_<table>_<column(s)>` | `idx_users_email` |
| ユニーク制約 | `<table>_<column>_key` | `users_email_key` |
| 外部キー制約 | `<table>_<column>_fkey` | `dive_logs_user_id_fkey` |
| 関数 | snake_case 動詞句 | `set_updated_at()` |

```sql
-- Bad
create table User (
    ID int,
    UserName varchar(255),
    isDeleted boolean
);

-- Good
create table users (
    id uuid primary key default gen_random_uuid(),
    user_name text not null,
    is_deleted boolean not null default false
);
```

## データ型の選び方

| 用途 | 推奨型 | 理由 |
|------|--------|------|
| 主キー | `uuid`（`gen_random_uuid()`） | 分散環境で衝突しない・推測されにくい |
| 文字列 | `text` | `varchar(n)` を使わない（PostgreSQL では性能差なし、長さ制限は CHECK 制約で表現） |
| 日時 | `timestamptz` | タイムゾーン込みで保存（`timestamp` は使わない） |
| 日付 | `date` | 時刻が不要な場合 |
| 金額 | `numeric(precision, scale)` | `float` / `real` は丸め誤差のため使わない |
| JSON | `jsonb` | `json` よりインデックス・検索性能が良い |
| 列挙 | `text` + `CHECK` 制約 | `enum` 型は ALTER が困難なため避ける |

```sql
-- Bad
status varchar(20)
amount float
created_at timestamp

-- Good
status text not null check (status in ('pending', 'active', 'inactive'))
amount numeric(10, 2) not null
created_at timestamptz not null default now()
```

## スキーマ設計

### NOT NULL とデフォルト値

- 値が必須のカラムには **必ず `not null`** を付ける
- 「不明」と「空」を区別する必要がない場合は `not null default ''` 等を検討

```sql
-- Good
email text not null,
name text not null default '',
deleted_at timestamptz  -- nullable は意味がある場合のみ
```

### 制約は DB 側で表現する

- ユニーク・外部キー・チェック制約は **DB 側に必ず定義** する（アプリケーション側のバリデーションだけに依存しない）

```sql
create table dive_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    depth_m numeric(5, 2) not null check (depth_m >= 0 and depth_m <= 200),
    duration_min integer not null check (duration_min > 0),
    dived_at timestamptz not null,
    created_at timestamptz not null default now()
);
```

### 削除戦略

- 物理削除を避けたい場合は `deleted_at timestamptz` でソフトデリート
- 外部キーには `on delete cascade` / `on delete set null` / `on delete restrict` を **必ず明示**

## 正規化

スキーマは **第 3 正規形（3NF）まで正規化** することを基本とする。意図的に非正規化する場合は理由をコメントに残す。

### 第 1 正規形（1NF）— 繰り返しを排除

1 カラムに複数値を詰め込まない。配列・カンマ区切り文字列・連番カラムは禁止。

```sql
-- Bad: カンマ区切り
create table users (
    id uuid primary key,
    tags text  -- 'diving,photography,travel'
);

-- Bad: 連番カラム
create table dive_logs (
    id uuid primary key,
    buddy1 text,
    buddy2 text,
    buddy3 text
);

-- Good: 子テーブルに分離
create table user_tags (
    user_id uuid not null references public.users(id) on delete cascade,
    tag text not null,
    primary key (user_id, tag)
);

create table dive_log_buddies (
    dive_log_id uuid not null references public.dive_logs(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,
    primary key (dive_log_id, user_id)
);
```

> 例外: 検索が不要で、常にまとまって扱う構造的データ（住所の構成要素など）は `jsonb` で保持しても良い。

### 第 2 正規形（2NF）— 部分関数従属を排除

複合主キーの一部だけに従属するカラムは別テーブルに切り出す。

```sql
-- Bad: dive_site_name は dive_site_id だけで決まるのに同じ行に保存
create table dive_logs (
    user_id uuid,
    dive_site_id uuid,
    dive_site_name text,  -- ← dive_site_id に従属
    dived_at timestamptz,
    primary key (user_id, dive_site_id, dived_at)
);

-- Good: ダイブサイトを別テーブルに
create table dive_sites (
    id uuid primary key default gen_random_uuid(),
    name text not null
);

create table dive_logs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id),
    dive_site_id uuid not null references public.dive_sites(id),
    dived_at timestamptz not null
);
```

### 第 3 正規形（3NF）— 推移関数従属を排除

主キー以外のカラムに従属するカラムは別テーブルに切り出す。

```sql
-- Bad: country_name は country_code に推移的に従属
create table users (
    id uuid primary key,
    country_code text,
    country_name text  -- ← country_code に従属
);

-- Good: 国マスタを分離
create table countries (
    code text primary key,
    name text not null
);

create table users (
    id uuid primary key default gen_random_uuid(),
    country_code text references public.countries(code)
);
```

### 多対多は中間テーブルで表現

```sql
-- Good: ユーザー × 取得資格の多対多
create table certifications (
    id uuid primary key default gen_random_uuid(),
    name text not null unique
);

create table user_certifications (
    user_id uuid not null references public.users(id) on delete cascade,
    certification_id uuid not null references public.certifications(id) on delete restrict,
    acquired_on date not null,
    primary key (user_id, certification_id)
);
```

### 計算可能な値を冗長に保存しない

```sql
-- Bad: 合計は明細から計算できる
create table orders (
    id uuid primary key,
    subtotal numeric,
    tax numeric,
    total numeric  -- ← subtotal + tax で導出可能
);

-- Good: 必要ならビュー / 集計クエリで取得
create view order_totals as
select
    o.id,
    sum(oi.price * oi.quantity) as subtotal,
    sum(oi.price * oi.quantity) * 0.1 as tax
from orders o
inner join order_items oi on oi.order_id = o.id
group by o.id;
```

> 例外: 集計テーブル（マテリアライズドビュー含む）が性能要件で必要な場合は許容。トリガで整合性を担保する。

### マスタ系と取引系を分離する

- **マスタ系**: 不変・低頻度更新・参照される側（`countries`, `dive_sites`, `certifications`）
- **取引系**: 高頻度に追加される・参照する側（`dive_logs`, `orders`）

両者を 1 テーブルに混ぜない。

### 非正規化する場合のルール

性能・運用上の理由で非正規化する場合は **必ず理由をコメントで残す**：

```sql
-- 月次集計クエリが N+1 で重いため、合計を冗長保存。
-- order_items の更新時にトリガで再計算する。
alter table orders add column items_total numeric not null default 0;
```

## タイムスタンプ

- すべてのテーブルに `created_at` / `updated_at` を付ける（履歴管理が必要な場合）
- `updated_at` はトリガで自動更新する

```sql
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;

create trigger users_handle_updated_at
    before update on public.users
    for each row
    execute function public.handle_updated_at();
```

### 関数の search_path は必ず固定する

PostgreSQL 関数で `search_path` を明示しないと、悪意ある同名オブジェクトでスキーマを乗っ取られる **search path injection** 攻撃が成立しうる（Supabase lint `function_search_path_mutable` の対象）。

```sql
-- Bad: search_path が呼び出し元の設定に依存（mutable）
create function public.foo()
returns trigger
language plpgsql
as $$ ... $$;

-- Good: 空に固定し、参照は全てスキーマ修飾
create function public.foo()
returns trigger
language plpgsql
set search_path = ''
as $$ ... $$;
```

- 関数本体で参照するテーブル・関数・型はすべて **スキーマ修飾**（`public.users`, `auth.uid()` など）
- `pg_catalog` は常に暗黙参照されるので `now()` / `gen_random_uuid()` 等はそのまま使える
- `security definer` 関数は特に `set search_path = ''` 必須（権限昇格の悪用を防ぐ）

## RLS（Row Level Security）— Supabase

- `public` スキーマのすべてのテーブルで **RLS を必ず有効化** する
- ポリシー無しで RLS を有効化すると全アクセスが拒否される（= デフォルト deny）
- 用途別に最小権限のポリシーを定義する

```sql
alter table public.dive_logs enable row level security;

-- 自分のログのみ参照可
create policy "users can read own dive logs"
    on public.dive_logs for select
    using ((select auth.uid()) = user_id);

-- 自分のログのみ作成可
create policy "users can insert own dive logs"
    on public.dive_logs for insert
    with check ((select auth.uid()) = user_id);

-- 自分のログのみ更新可
create policy "users can update own dive logs"
    on public.dive_logs for update
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
```

ポリシー名はダブルクォートで括った **英語の自然文** にする（`select`, `insert` 等の操作種別を含める）。

### auth 関数はサブクエリに包む（必須）

`auth.uid()` / `auth.jwt()` / `auth.role()` / `current_setting()` を RLS で使う場合は **必ず `(select ...)` で包む**。素のまま書くと PostgreSQL が行ごとに再評価し、テーブルが大きくなると顕著に遅くなる（Supabase の lint 警告 `auth_rls_initplan` の対象）。

```sql
-- Bad: 行ごとに auth.uid() が呼ばれる
using (auth.uid() = user_id)

-- Good: クエリ全体で 1 回だけ評価される（InitPlan として cache）
using ((select auth.uid()) = user_id)
```

`current_setting('request.jwt.claims', true)` 等も同様にサブクエリで包む。

## インデックス

- 外部キーカラムには **必ずインデックス**（PostgreSQL は自動生成しない）
- 検索条件・JOIN・ORDER BY に頻出するカラムに付与
- 複合インデックスはカラム順を「等価条件→範囲条件」の順にする

```sql
create index idx_dive_logs_user_id on public.dive_logs(user_id);
create index idx_dive_logs_user_id_dived_at on public.dive_logs(user_id, dived_at desc);
```

過剰なインデックスは書き込み性能を落とすため、本当に必要なものだけ追加する。

## マイグレーション規約

### ファイル名

```
supabase/migrations/<timestamp>_<動詞>_<対象>.sql
```

- `timestamp` は `YYYYMMDDHHMMSS` 形式
- `動詞` は `create` / `add` / `alter` / `drop` / `rename` のいずれか
- 例: `20260509100821_create_users.sql`, `20260510120000_add_users_role_column.sql`

### 1 マイグレーション 1 目的

- 1 ファイルに複数のテーブル変更を詰め込まない（差分の意味が読み取りにくくなる）
- ただし強い依存関係がある変更（FK 含む新テーブル群）は同一ファイルで OK

### 冪等性を意識する

```sql
-- Bad（再実行で失敗）
create table public.users (...);

-- Good（必要に応じて IF NOT EXISTS を使う／ただし DDL 履歴管理されるので通常は不要）
create table if not exists public.users (...);
```

Supabase CLI 管理下では履歴で冪等性が担保されるため `if not exists` は基本不要。ただしホットフィックス用途では使う。

### ロールバック

- `down` マイグレーションは原則書かない（Supabase CLI も標準対応していない）
- 取り消したい場合は **逆方向の新規マイグレーション** を追加する

## クエリスタイル

### キーワードは小文字

```sql
-- Bad
SELECT * FROM users WHERE email = 'a@example.com';

-- Good（PostgreSQL/Supabase コミュニティの慣習）
select * from users where email = 'a@example.com';
```

### `SELECT *` を避ける

```sql
-- Bad
select * from users;

-- Good
select id, email, created_at from users;
```

### JOIN の整形

- 各 JOIN は改行
- ON 条件はインデント

```sql
select
    dl.id,
    dl.dived_at,
    u.email
from public.dive_logs dl
inner join public.users u
    on u.id = dl.user_id
where dl.dived_at >= now() - interval '30 days'
order by dl.dived_at desc;
```

### バインドパラメータ必須

- アプリケーションコードからの SQL 実行時は **必ずプレースホルダを使う**（SQL インジェクション対策）
- 文字列連結で SQL を組み立てない

```typescript
// Bad
const { data } = await supabase.rpc(
    `select * from users where email = '${email}'`
);

// Good
const { data } = await supabase
    .from('users')
    .select('id, email')
    .eq('email', email);
```

## コメント

- テーブル・カラムの **意図** を `comment on` で残す
- 単純な何をするかは書かない（型と名前で表現する）

```sql
comment on table public.dive_logs is 'ユーザーが記録したダイビング 1 本ごとのログ';
comment on column public.dive_logs.depth_m is '最大深度（メートル）。0〜200 の範囲';
```

## その他

- `delete from <table>;`（WHERE 無し）を本番に流さない
- `drop table` を含むマイグレーションは特に慎重にレビュー
- 本番 DB に対する直接 SQL 実行は禁止。必ずマイグレーションファイル経由
- マスター系テーブルの初期データは `seed.sql` で管理する
