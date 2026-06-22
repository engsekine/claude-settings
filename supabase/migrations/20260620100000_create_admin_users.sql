-- ========================================
-- admin_users テーブル（管理者識別）
-- 利用者プロフィール（public.users）とは分離した専用の管理者識別情報。
-- auth.users を共有し、ここに有効行があるユーザーのみ管理者とみなす。
-- 2 段階の権限（admin / superadmin）を持ち、管理者の追加・無効化は superadmin のみ。
-- 仕様: specs/015-admin-panel/data-model.md（FR-005 / FR-015）
--
-- 注意: RLS ポリシーはこのファイルでは定義しない。
-- admin_users を参照するポリシーを admin_users 自身に直接書くと
-- RLS 評価が無限再帰する（Supabase の既知の落とし穴）。
-- security definer 関数 is_admin() / is_superadmin() を経由して再帰を避けるため、
-- 関数とポリシーは次のマイグレーション（create_admin_auth_functions）でまとめて定義する。
-- ========================================

create table public.admin_users (
    id uuid primary key references auth.users(id) on delete cascade,
    display_name text not null check (length(trim(display_name)) > 0),
    role text not null default 'admin' check (role in ('admin', 'superadmin')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz
);

comment on table public.admin_users is '管理画面（admin-front）にアクセスできる管理者。利用者プロフィールとは分離して識別する';
comment on column public.admin_users.display_name is '管理画面上の表示名';
comment on column public.admin_users.role is '権限種別。admin（データ管理のみ）/ superadmin（管理者の追加・無効化が可能）';
comment on column public.admin_users.deleted_at is '無効化（ソフトデリート）日時。null の行のみ有効な管理者';

-- 有効な管理者の判定用（is_admin / is_superadmin が参照）
create index idx_admin_users_active on public.admin_users (id) where deleted_at is null;

-- updated_at 自動更新（handle_updated_at は users マイグレーションで定義済み）
create trigger admin_users_handle_updated_at
    before update on public.admin_users
    for each row
    execute function public.handle_updated_at();

-- RLS は有効化のみ（ポリシーは create_admin_auth_functions で追加）。
-- ポリシー無しの間は default deny（service role / マイグレーションのみ書き込み可）。
alter table public.admin_users enable row level security;
