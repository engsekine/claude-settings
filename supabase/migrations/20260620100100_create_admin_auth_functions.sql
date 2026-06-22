-- ========================================
-- 管理者判定関数 + admin_users の RLS ポリシー
-- 仕様: specs/015-admin-panel/data-model.md（Constitution IV: Security & RLS by Default）
--
-- is_admin() / is_superadmin() は security definer + search_path 固定。
-- security definer により関数本体の admin_users 参照は RLS をバイパスするため、
-- admin_users 自身のポリシーからこれらを呼んでも無限再帰しない。
-- ========================================

-- 有効な管理者か（admin_users に deleted_at is null の行があるか）
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
    select exists (
        select 1
        from public.admin_users a
        where a.id = (select auth.uid())
          and a.deleted_at is null
    );
$$;

comment on function public.is_admin() is '呼び出し元が有効な管理者（admin_users に deleted_at is null の行）かを返す。RLS ポリシーで使用';

-- 有効な上位管理者か（管理者の追加・無効化を許可する判定）
create or replace function public.is_superadmin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
    select exists (
        select 1
        from public.admin_users a
        where a.id = (select auth.uid())
          and a.role = 'superadmin'
          and a.deleted_at is null
    );
$$;

comment on function public.is_superadmin() is '呼び出し元が有効な superadmin かを返す。管理者アカウントの管理可否判定に使用';

-- ========================================
-- admin_users の RLS ポリシー（関数経由で再帰回避）
-- ========================================

-- 管理者は管理者一覧を参照できる
create policy "admins read admin users"
    on public.admin_users for select
    to authenticated
    using ((select public.is_admin()));

-- 管理者アカウントの追加・更新・無効化は superadmin のみ
-- （自己無効化・最後の superadmin の保護はアプリ層で担保。FR-015）
create policy "superadmins manage admin users"
    on public.admin_users for all
    to authenticated
    using ((select public.is_superadmin()))
    with check ((select public.is_superadmin()));
