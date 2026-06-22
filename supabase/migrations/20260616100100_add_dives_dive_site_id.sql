-- ========================================
-- dives にダイブサイト参照を追加
-- マスタ参照（dive_site_id）と自由入力（location）の同居・排他を導入する。
-- 既存ログは location 設定済み・dive_site_id null のため無変更で互換。
-- 仕様: specs/011-dive-sites-master/data-model.md
-- ========================================

-- ダイブサイト参照（任意）。参照中サイトの削除は restrict で防ぐ（FR-009 の DB 安全網）
alter table public.dives
    add column dive_site_id uuid references public.dive_sites(id) on delete restrict;

comment on column public.dives.dive_site_id is 'ダイブサイト（マスタ）への参照（任意）。設定時は location を null とし表示名はマスタから取得する';

-- サイト参照時は location を保持しないため nullable 化
alter table public.dives
    alter column location drop not null;

-- 既存の location 単体 CHECK を排他 CHECK に置き換える
alter table public.dives
    drop constraint if exists dives_location_check;

-- サイト参照と自由入力は排他・どちらか一方が必須
alter table public.dives
    add constraint dives_site_or_location_check check (
        (dive_site_id is not null and location is null)
        or (dive_site_id is null and location is not null and length(trim(location)) > 0)
    );

-- 本人のサイト別実績集計用（FK インデックスも兼ねる）
create index idx_dives_user_id_dive_site_id on public.dives (user_id, dive_site_id);
