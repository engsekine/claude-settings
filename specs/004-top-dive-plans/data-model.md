# Data Model: dive_plans / plan_packing_items

004-top-dive-plans が新規追加するテーブル定義。マイグレーション: `supabase/migrations/<ts>_create_dive_plans.sql`（2 テーブルは強依存のため 1 ファイル）。

## ER

```text
users 1 ──── N dive_plans 1 ──── N plan_packing_items
（user 削除で予定が連動削除、予定削除で持ち物が連動削除）

dives / regulators とは直接の FK 関係なし（TOP 表示で並ぶだけ）
```

## public.dive_plans

ユーザーが登録するダイビング予定。

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| `id` | `uuid` | PK, `default gen_random_uuid()` | |
| `user_id` | `uuid` | NOT NULL, FK → `public.users(id)` `on delete cascade` | 所有者 |
| `planned_on` | `date` | NOT NULL | 予定日（時刻は管理しない。spec の Assumption） |
| `location` | `text` | NOT NULL, `check (char_length(location) between 1 and 120)` | ポイント名（dives.location と同じ上限） |
| `notes` | `text` | `check (notes is null or char_length(notes) <= 2000)` | メモ（任意） |
| `created_at` | `timestamptz` | NOT NULL, `default now()` | |
| `updated_at` | `timestamptz` | NOT NULL, `default now()` | トリガで自動更新 |

- **過去日の insert を禁止しない**: 「行ってきたダイビングを後から予定として記録する」ことは想定しないが、編集中に日付が過ぎるケースがあるため DB 制約にはしない。フォーム側バリデーションも未来日強制はしない（research.md Decision 4 の導出ロジックで「終了済み」になるだけ）
- **status カラムなし**: 「終了済み」は `planned_on < JST 今日` で導出（Decision 4）

### インデックス

```sql
create index idx_dive_plans_user_id_planned_on on public.dive_plans(user_id, planned_on);
```

「自分の予定を日付順で取得」「最も近い未来の予定 1 件」の両クエリをカバーする。

### RLS

```sql
alter table public.dive_plans enable row level security;

create policy "users can read own dive plans"
    on public.dive_plans for select
    using ((select auth.uid()) = user_id);

create policy "users can insert own dive plans"
    on public.dive_plans for insert
    with check ((select auth.uid()) = user_id);

create policy "users can update own dive plans"
    on public.dive_plans for update
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy "users can delete own dive plans"
    on public.dive_plans for delete
    using ((select auth.uid()) = user_id);
```

### トリガ

```sql
create trigger dive_plans_handle_updated_at
    before update on public.dive_plans
    for each row
    execute function public.handle_updated_at();
```

（`public.handle_updated_at()` は 001 で作成済みの `set search_path = ''` 付き共通関数を再利用）

## public.plan_packing_items

予定ごとの持ち物項目。予定作成時にデフォルト 12 項目が展開され、以後は通常の行として操作される（research.md Decision 2）。

| カラム | 型 | 制約 | 説明 |
|---|---|---|---|
| `id` | `uuid` | PK, `default gen_random_uuid()` | |
| `plan_id` | `uuid` | NOT NULL, FK → `public.dive_plans(id)` `on delete cascade` | 予定削除で連動削除（FR-014） |
| `name` | `text` | NOT NULL, `check (char_length(name) between 1 and 60)` | 項目名 |
| `is_checked` | `boolean` | NOT NULL, `default false` | チェック状態 |
| `position` | `integer` | NOT NULL, `default 0` | 表示順（デフォルト項目は定義順、追加項目は末尾） |
| `created_at` | `timestamptz` | NOT NULL, `default now()` | |
| `updated_at` | `timestamptz` | NOT NULL, `default now()` | トリガで自動更新 |

- `user_id` は持たない（`plan_id` 経由で所有者が一意に決まる。3NF）

### インデックス

```sql
create index idx_plan_packing_items_plan_id_position on public.plan_packing_items(plan_id, position);
```

### RLS

親予定の所有者のみ全操作可。`auth.uid()` はサブクエリで包む（`auth_rls_initplan` 対策）。

```sql
alter table public.plan_packing_items enable row level security;

create policy "users can read own packing items"
    on public.plan_packing_items for select
    using (
        exists (
            select 1 from public.dive_plans p
            where p.id = plan_id and p.user_id = (select auth.uid())
        )
    );

create policy "users can insert own packing items"
    on public.plan_packing_items for insert
    with check (
        exists (
            select 1 from public.dive_plans p
            where p.id = plan_id and p.user_id = (select auth.uid())
        )
    );

create policy "users can update own packing items"
    on public.plan_packing_items for update
    using (
        exists (
            select 1 from public.dive_plans p
            where p.id = plan_id and p.user_id = (select auth.uid())
        )
    )
    with check (
        exists (
            select 1 from public.dive_plans p
            where p.id = plan_id and p.user_id = (select auth.uid())
        )
    );

create policy "users can delete own packing items"
    on public.plan_packing_items for delete
    using (
        exists (
            select 1 from public.dive_plans p
            where p.id = plan_id and p.user_id = (select auth.uid())
        )
    );
```

### トリガ

```sql
create trigger plan_packing_items_handle_updated_at
    before update on public.plan_packing_items
    for each row
    execute function public.handle_updated_at();
```

## コメント（comment on）

```sql
comment on table public.dive_plans is 'ユーザーが登録するダイビング予定（日付単位、時刻は管理しない）';
comment on column public.dive_plans.planned_on is '予定日。過去日になった予定は表示時に「終了済み」として導出される';
comment on table public.plan_packing_items is '予定ごとの持ち物チェックリスト。予定作成時にデフォルト項目が展開される';
comment on column public.plan_packing_items.position is '表示順。デフォルト項目は定義順、ユーザー追加項目は末尾に採番';
```

## アプリ型との対応

- 生成型 `Database['public']['Tables']['dive_plans' | 'plan_packing_items']['Row']` を使用し、手書き row 型は作らない（arch/feature-based.md データ層規約）
- マイグレーション適用後に `npx supabase gen types typescript --local` で `packages/supabase/src/types.ts` を再生成する
