-- ========================================
-- dive_photos テーブル
-- ダイブログに添付する写真 1 枚のメタデータ（画像本体は Storage 'dive-photos' バケット）
-- 1 dive : 多 dive_photos（dive_id で 1:N、ログ削除でカスケード）
-- 仕様: specs/012-photo-attachments/data-model.md
-- ========================================
create table public.dive_photos (
    id uuid primary key default gen_random_uuid(),
    dive_id uuid not null references public.dives(id) on delete cascade,
    user_id uuid not null references public.users(id) on delete cascade,

    display_path text not null,
    thumb_path text not null,

    caption text not null default '' check (char_length(caption) <= 200),
    sort_order integer not null default 0 check (sort_order >= 0),
    is_cover boolean not null default false,

    width integer,
    height integer,

    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

comment on table public.dive_photos is 'ダイブログに添付した写真のメタデータ。本体は Storage dive-photos バケット';
comment on column public.dive_photos.user_id is '所有者。dives.user_id と同値（RLS・Storage パス整合・FK 用に保持）';
comment on column public.dive_photos.display_path is '表示用 WebP の Storage パス（{user_id}/{dive_id}/display/{id}.webp）';
comment on column public.dive_photos.thumb_path is 'サムネイル WebP の Storage パス（.../thumb/{id}.webp）';
comment on column public.dive_photos.caption is '任意のキャプション（最大 200 文字）。空文字は未設定';
comment on column public.dive_photos.sort_order is '表示順（昇順）。ログ内で連番';
comment on column public.dive_photos.is_cover is '代表写真フラグ。ログ内で高々 1 件（部分ユニークで担保）';

-- ========================================
-- インデックス
-- ========================================
create index idx_dive_photos_dive_id_sort_order on public.dive_photos (dive_id, sort_order);
create index idx_dive_photos_user_id on public.dive_photos (user_id);

-- 代表写真はログ内 1 枚に限定（is_cover = true の行だけを対象にした部分ユニーク）
create unique index idx_dive_photos_one_cover_per_dive
    on public.dive_photos (dive_id)
    where is_cover;

comment on index public.idx_dive_photos_one_cover_per_dive is
    '代表写真は 1 ログにつき高々 1 枚（is_cover=true のみ対象）';

-- ========================================
-- updated_at 自動更新（handle_updated_at は users マイグレーションで定義済み）
-- ========================================
create trigger dive_photos_handle_updated_at
    before update on public.dive_photos
    for each row
    execute function public.handle_updated_at();

-- ========================================
-- RLS
-- 本人は自分の写真を CRUD 可。公開ログ（dives.is_public）の写真は誰でも参照可
-- ========================================
alter table public.dive_photos enable row level security;

create policy "users can read own dive photos"
    on public.dive_photos for select
    using ((select auth.uid()) = user_id);

create policy "anyone can read public dive photos"
    on public.dive_photos for select
    using (
        exists (
            select 1
            from public.dives d
            where d.id = dive_id
              and d.is_public
        )
    );

create policy "users can insert own dive photos"
    on public.dive_photos for insert
    with check ((select auth.uid()) = user_id);

create policy "users can update own dive photos"
    on public.dive_photos for update
    using ((select auth.uid()) = user_id)
    with check ((select auth.uid()) = user_id);

create policy "users can delete own dive photos"
    on public.dive_photos for delete
    using ((select auth.uid()) = user_id);
