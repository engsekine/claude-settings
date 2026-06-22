-- ========================================
-- ソフトデリート列の追加（論理削除）
-- 管理画面の削除は原則ソフトデリート（deleted_at）で行う。
-- 仕様: specs/015-admin-panel/data-model.md（FR-018）
--
-- クロスアプリ影響: service-front の利用者向けクエリは deleted_at is null を
-- 考慮する必要がある（別タスク T060 で対応）。本マイグレーションは列追加のみ。
-- ========================================

alter table public.dives add column deleted_at timestamptz;
alter table public.dive_sites add column deleted_at timestamptz;
alter table public.dive_photos add column deleted_at timestamptz;

comment on column public.dives.deleted_at is '論理削除日時。null の行のみ有効（管理画面のソフトデリートで設定）';
comment on column public.dive_sites.deleted_at is '論理削除日時。null の行のみ有効';
comment on column public.dive_photos.deleted_at is '論理削除日時。null の行のみ有効';

-- 有効行（未削除）の絞り込み用の部分インデックス
create index idx_dives_active on public.dives (user_id) where deleted_at is null;
create index idx_dive_sites_active on public.dive_sites (id) where deleted_at is null;
create index idx_dive_photos_active on public.dive_photos (dive_id) where deleted_at is null;
