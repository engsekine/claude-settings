-- ========================================
-- dive_plans / plan_packing_items テーブル
-- ダイビング予定と予定ごとの持ち物チェックリスト
-- 1 ユーザー : 多 dive_plans、1 予定 : 多 plan_packing_items
-- 仕様: specs/004-top-dive-plans/data-model.md
-- ========================================

create table public.dive_plans (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,

    planned_on date not null,
    location text not null check (char_length(location) between 1 and 120),
    notes text check (notes is null or char_length(notes) <= 2000),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.dive_plans is 'ユーザーが登録するダイビング予定（日付単位、時刻は管理しない）';
comment on column public.dive_plans.planned_on is '予定日。過去日になった予定は表示時に「終了済み」として導出される';

-- 「自分の予定を日付順で取得」「最も近い未来の予定 1 件」の両クエリをカバー
create index idx_dive_plans_user_id_planned_on on public.dive_plans(user_id, planned_on);

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

-- updated_at 自動更新（handle_updated_at は users マイグレーションで定義済み）
create trigger dive_plans_handle_updated_at
    before update on public.dive_plans
    for each row
    execute function public.handle_updated_at();

-- ========================================
-- plan_packing_items
-- 予定作成時にデフォルト項目が展開され、以後は通常の行として操作される
-- ========================================

create table public.plan_packing_items (
    id uuid primary key default gen_random_uuid(),
    plan_id uuid not null references public.dive_plans(id) on delete cascade,

    name text not null check (char_length(name) between 1 and 60),
    is_checked boolean not null default false,
    position integer not null default 0,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.plan_packing_items is '予定ごとの持ち物チェックリスト。予定作成時にデフォルト項目が展開される';
comment on column public.plan_packing_items.position is '表示順。デフォルト項目は定義順、ユーザー追加項目は末尾に採番';

create index idx_plan_packing_items_plan_id_position on public.plan_packing_items(plan_id, position);

alter table public.plan_packing_items enable row level security;

-- 親予定の所有者のみ全操作可（auth.uid() はサブクエリで包む: auth_rls_initplan 対策）
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

create trigger plan_packing_items_handle_updated_at
    before update on public.plan_packing_items
    for each row
    execute function public.handle_updated_at();
