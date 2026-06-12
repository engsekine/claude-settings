-- ========================================
-- certifications テーブル
-- ユーザーが保有するダイビングライセンス資格
-- 1 ユーザー : 多 certifications（OW → AOW → Rescue のような段階取得が一般的なため）
-- 仕様: specs/006-diving-certifications/data-model.md
-- ========================================

create table public.certifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.users(id) on delete cascade,
    dive_id uuid references public.dives(id) on delete set null,

    agency text not null check (agency in ('padi', 'naui', 'ssi', 'bsac', 'cmas', 'other')),
    rank text not null check (length(trim(rank)) > 0 and char_length(rank) <= 60),
    -- 厳密な「未来日付不可」はユーザーのローカル日付基準でアプリ層が検証する。
    -- DB の current_date は UTC 基準のため +1 日をタイムゾーン差の安全網として許容する
    acquired_on date not null check (acquired_on >= '1900-01-01' and acquired_on <= current_date + 1),

    -- 任意の詳細項目
    diver_number text check (diver_number is null or char_length(diver_number) <= 60),
    instructor_number text check (instructor_number is null or char_length(instructor_number) <= 60),
    trained_by text check (trained_by is null or char_length(trained_by) <= 120),
    acquired_location text check (acquired_location is null or char_length(acquired_location) <= 120),

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),

    -- 同一団体・同一ランクの重複登録防止（certifications_user_id_agency_rank_key）
    unique (user_id, agency, rank)
);

comment on table public.certifications is 'ユーザーが保有するダイビングライセンス資格。1 ユーザーに複数件紐づく';
comment on column public.certifications.dive_id is '資格を取得したダイブログ（任意）。ログ削除時は null になり資格自体は残る';
comment on column public.certifications.agency is '指導団体。padi / naui / ssi / bsac / cmas / other の 6 値';
comment on column public.certifications.rank is '資格ランク名（自由入力）。trim 後 1 文字以上・60 文字以内';
comment on column public.certifications.acquired_on is '資格取得日。1900-01-01 〜 当日（当日判定はアプリ層、CHECK の +1 はタイムゾーン差の許容）';
comment on column public.certifications.diver_number is 'C カードに記載されるダイバーナンバー（任意）';
comment on column public.certifications.instructor_number is '認定したインストラクターのナンバー（任意）';
comment on column public.certifications.trained_by is '講習を受けた指導者・ショップ名（任意）';
comment on column public.certifications.acquired_location is '資格を取得した場所（任意）';

-- 一覧の取得日降順表示用（同日取得の第 2 ソートキー created_at はクエリ側で指定）
create index idx_certifications_user_id_acquired_on on public.certifications(user_id, acquired_on desc);

-- 外部キーカラムのインデックス（PostgreSQL は自動生成しないため）
create index idx_certifications_dive_id on public.certifications(dive_id);

alter table public.certifications enable row level security;

create policy "users can read own certifications"
    on public.certifications for select
    using ((select auth.uid()) = user_id);

create policy "users can insert own certifications"
    on public.certifications for insert
    with check ((select auth.uid()) = user_id);

create policy "users can update own certifications"
    on public.certifications for update
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy "users can delete own certifications"
    on public.certifications for delete
    using ((select auth.uid()) = user_id);

-- updated_at 自動更新（handle_updated_at は users マイグレーションで定義済み）
create trigger certifications_handle_updated_at
    before update on public.certifications
    for each row
    execute function public.handle_updated_at();
