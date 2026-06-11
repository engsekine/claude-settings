-- ========================================
-- regulators テーブル
-- レギュレーター機材とオーバーホール（OH）周期の管理
-- 1 ユーザー : 多 regulators。メイン機材（is_primary）は 1 ユーザー 1 件
-- 仕様: specs/003-dashboard/plan.md データモデル節
-- ========================================

create table public.regulators (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,

    brand text not null check (length(trim(brand)) > 0 and char_length(brand) <= 60),
    model text not null check (length(trim(model)) > 0 and char_length(model) <= 80),
    purchased_on date,
    last_overhauled_on date not null check (last_overhauled_on >= '1900-01-01' and last_overhauled_on <= current_date),
    overhaul_interval_months integer not null default 12 check (overhaul_interval_months > 0),
    overhaul_interval_dives integer not null default 100 check (overhaul_interval_dives > 0),
    is_primary boolean not null default false,
    notes text check (notes is null or char_length(notes) <= 500),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.regulators is 'ユーザーのレギュレーター機材。OH 期限管理に必要な周期情報を保持する';
comment on column public.regulators.last_overhauled_on is '前回オーバーホール日。OH 完了記録で今日に更新される';
comment on column public.regulators.is_primary is 'メイン機材フラグ。TOP の OH ステータス表示対象。1 ユーザー 1 件（部分ユニーク制約）';

-- 1 ユーザー 1 メイン機材
create unique index regulators_user_id_is_primary_key
    on public.regulators (user_id)
    where is_primary = true;

-- メイン機材の引き当て用
create index idx_regulators_user_id_is_primary on public.regulators(user_id, is_primary);

alter table public.regulators enable row level security;

create policy "users can read own regulators"
    on public.regulators for select
    using ((select auth.uid()) = user_id);

create policy "users can insert own regulators"
    on public.regulators for insert
    with check ((select auth.uid()) = user_id);

create policy "users can update own regulators"
    on public.regulators for update
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy "users can delete own regulators"
    on public.regulators for delete
    using ((select auth.uid()) = user_id);

-- updated_at 自動更新（handle_updated_at は users マイグレーションで定義済み）
create trigger regulators_handle_updated_at
    before update on public.regulators
    for each row
    execute function public.handle_updated_at();
