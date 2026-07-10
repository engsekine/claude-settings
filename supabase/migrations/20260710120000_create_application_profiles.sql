-- 申し込みシートの再利用用に、既存データから導出できない個人属性のみを保持する（users と 1:1）
create table public.application_profiles (
    user_id uuid primary key references public.users(id) on delete cascade,
    phone text not null default '' check (char_length(phone) <= 20),
    emergency_contact_relation text not null default '' check (char_length(emergency_contact_relation) <= 40),
    emergency_contact_phone text not null default '' check (char_length(emergency_contact_phone) <= 20),
    nearest_station text not null default '' check (char_length(nearest_station) <= 100),
    foot_size_cm numeric(4, 1) check (foot_size_cm > 0 and foot_size_cm <= 50),
    has_izu_chiba_experience boolean,
    has_boat_experience boolean,
    has_dry_suit_experience boolean,
    dry_suit_dive_count integer check (dry_suit_dive_count >= 0),
    has_contact_lens boolean,
    contact_lens_type text check (contact_lens_type in ('hard', 'soft', 'disposable')),
    needs_prescription_mask boolean,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.application_profiles is '申し込みシートの再利用用に保存する個人属性（users と 1:1・レンタル選択は保存しない）';
comment on column public.application_profiles.foot_size_cm is '足のサイズ（cm）。スーツレンタル時に使用';
comment on column public.application_profiles.has_izu_chiba_experience is '伊豆・千葉でのダイビング経験。null = 未入力（「無」と区別する）';
comment on column public.application_profiles.dry_suit_dive_count is 'ドライスーツの経験本数（約）';
comment on column public.application_profiles.contact_lens_type is 'コンタクトレンズの種類。有りの場合のみ意味を持つ';

create trigger application_profiles_handle_updated_at
    before update on public.application_profiles
    for each row
    execute function public.handle_updated_at();

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
