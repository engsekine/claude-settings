-- 申し込みシートを名前付きで複数保存できるようにするため、users と 1:1 の
-- application_profiles を廃止し、1 ユーザー N 件の application_sheets に置き換える。
-- 未リリース機能のため既存データの移行は行わない（clarify 2026-07-11）。
drop table public.application_profiles;

-- シートはフォーム全体のスナップショット（自動入力値の上書き・レンタル選択も保存する）
create table public.application_sheets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    name text not null check (length(trim(name)) > 0 and char_length(name) <= 50),
    full_name text not null default '' check (char_length(full_name) <= 60),
    age integer check (age >= 0 and age <= 999),
    birth_on date,
    gender text check (gender in ('male', 'female')),
    phone text not null default '' check (char_length(phone) <= 20),
    emergency_contact_relation text not null default '' check (char_length(emergency_contact_relation) <= 40),
    emergency_contact_phone text not null default '' check (char_length(emergency_contact_phone) <= 20),
    nearest_station text not null default '' check (char_length(nearest_station) <= 100),
    license_rank text not null default '' check (char_length(license_rank) <= 60),
    dive_count integer check (dive_count >= 0),
    has_izu_chiba_experience boolean,
    has_boat_experience boolean,
    last_dive_year_month text check (last_dive_year_month ~ '^\d{4}-\d{2}$'),
    has_dry_suit_experience boolean,
    dry_suit_dive_count integer check (dry_suit_dive_count >= 0),
    has_rental boolean,
    -- レンタル品目キーの配列。個別に検索せず常にシート単位でまとめて扱うスナップショットのため、
    -- 子テーブルではなく jsonb で保持する（SQL 規約 1NF の例外条項に該当）
    rental_items jsonb not null default '[]'::jsonb,
    omit_rental_block boolean not null default false,
    height_cm numeric(4, 1) check (height_cm > 0 and height_cm <= 300),
    weight_kg numeric(4, 1) check (weight_kg > 0 and weight_kg <= 500),
    foot_size_cm numeric(4, 1) check (foot_size_cm > 0 and foot_size_cm <= 50),
    has_contact_lens boolean,
    contact_lens_type text check (contact_lens_type in ('hard', 'soft', 'disposable')),
    needs_prescription_mask boolean,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.application_sheets is '申し込みシートの保存スナップショット（1 ユーザー N 件・名前付き）。一覧から選択して再利用する';
comment on column public.application_sheets.name is 'シート名（一覧での識別用。例: 〇〇ショップ用）';
comment on column public.application_sheets.rental_items is '選択したレンタル品目キーの配列（アプリの RENTAL_ITEMS と同期）';
comment on column public.application_sheets.has_izu_chiba_experience is '伊豆・千葉でのダイビング経験。null = 未入力（「無」と区別する）';
comment on column public.application_sheets.contact_lens_type is 'コンタクトレンズの種類。有りの場合のみ意味を持つ';

-- 一覧は本人のシートを更新日時降順で表示する
create index idx_application_sheets_user_id_updated_at on public.application_sheets(user_id, updated_at desc);

create trigger application_sheets_handle_updated_at
    before update on public.application_sheets
    for each row
    execute function public.handle_updated_at();

alter table public.application_sheets enable row level security;

create policy "users can read own application sheets"
    on public.application_sheets for select
    using ((select auth.uid()) = user_id);

create policy "users can insert own application sheets"
    on public.application_sheets for insert
    with check ((select auth.uid()) = user_id);

create policy "users can update own application sheets"
    on public.application_sheets for update
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy "users can delete own application sheets"
    on public.application_sheets for delete
    using ((select auth.uid()) = user_id);
