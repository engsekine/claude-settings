-- 申し込みシートの基本情報（1 ユーザー 1 件）。
-- シートとは別に保存し、新規シート作成時の自動入力に使う（clarify 2026-07-11: 専用の保存ボタン）
create table public.application_base_profiles (
    user_id uuid primary key references public.users(id) on delete cascade,
    full_name text not null default '' check (char_length(full_name) <= 60),
    age integer check (age >= 0 and age <= 999),
    birth_on date,
    gender text check (gender in ('male', 'female')),
    phone text not null default '' check (char_length(phone) <= 20),
    emergency_contact_relation text not null default '' check (char_length(emergency_contact_relation) <= 40),
    emergency_contact_phone text not null default '' check (char_length(emergency_contact_phone) <= 20),
    nearest_station text not null default '' check (char_length(nearest_station) <= 100),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.application_base_profiles is '申し込みシートの基本情報（1 ユーザー 1 件）。新規シート作成時の自動入力に使う';
comment on column public.application_base_profiles.full_name is 'お名前（プロフィール由来の値を上書き保存できる）';

create trigger application_base_profiles_handle_updated_at
    before update on public.application_base_profiles
    for each row
    execute function public.handle_updated_at();

alter table public.application_base_profiles enable row level security;

create policy "users can read own application base profile"
    on public.application_base_profiles for select
    using ((select auth.uid()) = user_id);

create policy "users can insert own application base profile"
    on public.application_base_profiles for insert
    with check ((select auth.uid()) = user_id);

create policy "users can update own application base profile"
    on public.application_base_profiles for update
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);
