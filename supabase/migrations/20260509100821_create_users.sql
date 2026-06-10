-- ========================================
-- users テーブル
-- auth.users(id) を主キーとして共有することで Auth と整合
-- ========================================
create table public.users (
    id uuid primary key references auth.users(id) on delete cascade,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- ========================================
-- updated_at 自動更新トリガー（汎用関数）
-- 他テーブルでも同じ関数を使い回せる
-- ========================================
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

-- ========================================
-- Auth signup 時に public.users に自動挿入
-- security definer で RLS をバイパスして auth スキーマへアクセス
-- ========================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
    insert into public.users (id) values (new.id);
    return new;
end;
$$;

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute function public.handle_new_user();

-- ========================================
-- RLS
-- 自分のプロフィールのみ参照・更新可
-- insert は handle_new_user（security definer）経由のため policy 不要
-- ========================================
alter table public.users enable row level security;

create policy "users can view own profile"
    on public.users for select
    using ((select auth.uid()) = id);

create policy "users can update own profile"
    on public.users for update
    using ((select auth.uid()) = id);
