-- ========================================
-- dives テーブル
-- ダイビングログ。PADI ログブックの標準項目を踏襲
-- 1 ユーザー : 多 dives（owner_id で 1:N）
-- ========================================
create table public.dives (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,

    dive_number integer check (dive_number is null or dive_number >= 0),
    dive_date date not null check (dive_date >= '1900-01-01' and dive_date <= current_date),
    entry_time time,
    exit_time time,

    location text not null check (length(trim(location)) > 0),
    dive_type text,
    weather text,

    air_temp_c numeric(4, 1),
    water_temp_c numeric(4, 1),
    visibility_m numeric(4, 1) check (visibility_m is null or visibility_m >= 0),
    wave text,
    current_condition text,

    max_depth_m numeric(5, 2) not null check (max_depth_m > 0 and max_depth_m <= 300),
    avg_depth_m numeric(5, 2) check (avg_depth_m is null or (avg_depth_m > 0 and avg_depth_m <= 300)),
    bottom_time_min integer not null check (bottom_time_min >= 1),

    tank_type text check (tank_type is null or tank_type in ('aluminum', 'steel')),
    tank_volume_l numeric(4, 1) check (tank_volume_l is null or tank_volume_l > 0),
    gas_type text,
    o2_percent numeric(4, 1) check (o2_percent is null or (o2_percent >= 0 and o2_percent <= 100)),
    pressure_start_bar integer check (pressure_start_bar is null or pressure_start_bar >= 0),
    pressure_end_bar integer check (pressure_end_bar is null or pressure_end_bar >= 0),
    weight_kg numeric(4, 1) check (weight_kg is null or weight_kg >= 0),
    suit_type text,
    equipment_notes text,

    buddy_name text,
    instructor_name text,
    certification_dive boolean not null default false,
    notes text,

    is_public boolean not null default false,
    public_slug text unique,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.dives is 'ダイビングログ。PADI 標準項目を踏襲、ユーザーごとに保有';
comment on column public.dives.dive_number is '通算ダイブ番号（ユーザーが任意で管理）';
comment on column public.dives.dive_date is '潜水日。1900-01-01 〜 当日の範囲';
comment on column public.dives.location is 'エリア / ポイント名（必須）';
comment on column public.dives.max_depth_m is '最大水深（m）。0 < x <= 300';
comment on column public.dives.bottom_time_min is '潜水時間（分）。>= 1';
comment on column public.dives.current_condition is '流れの状況。予約語 current を避けて current_condition';
comment on column public.dives.tank_type is 'タンク種別。aluminum / steel のみ許容';
comment on column public.dives.is_public is '公開フラグ。phase2 で使用';
comment on column public.dives.public_slug is '公開URL用 slug。is_public=true のときのみ意味を持つ';

-- ========================================
-- インデックス
-- ========================================
create index idx_dives_user_id_dive_date on public.dives (user_id, dive_date desc);
create index idx_dives_user_id_location on public.dives (user_id, location);
create index idx_dives_public_slug on public.dives (public_slug) where is_public = true;

-- ========================================
-- dive_number にユーザー単位の部分ユニーク制約を追加
-- NULL は対象外（ダイブ番号は任意項目で、未入力ログは複数共存可）
-- ========================================
create unique index dives_user_id_dive_number_key
    on public.dives (user_id, dive_number)
    where dive_number is not null;

comment on index public.dives_user_id_dive_number_key is
    '同一ユーザー内で dive_number は重複不可（NULL は対象外）';

-- ========================================
-- updated_at 自動更新（handle_updated_at は users マイグレーションで定義済み）
-- ========================================
create trigger dives_handle_updated_at
    before update on public.dives
    for each row
    execute function public.handle_updated_at();

-- ========================================
-- RLS
-- 自分のログのみ参照・作成・更新・削除可能
-- ========================================
alter table public.dives enable row level security;

create policy "users can read own dives"
    on public.dives for select
    using ((select auth.uid()) = user_id);

create policy "users can insert own dives"
    on public.dives for insert
    with check ((select auth.uid()) = user_id);

create policy "users can update own dives"
    on public.dives for update
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy "users can delete own dives"
    on public.dives for delete
    using ((select auth.uid()) = user_id);
