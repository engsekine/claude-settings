-- ========================================
-- 管理者向け RLS ポリシーの追加
-- 各管理対象テーブルに「管理者なら全行を操作可」のポリシーを追加する。
-- 既存の「本人のみ」ポリシーは残し、OR 評価で本人 or 管理者がアクセス可能にする。
-- 仕様: specs/015-admin-panel/data-model.md（Constitution IV）
--
-- is_admin() は security definer + stable。RLS の initplan 最適化のため
-- (select public.is_admin()) でサブクエリに包む（sql.md: auth_rls_initplan 相当）。
-- ========================================

create policy "admins manage all users"
    on public.users for all
    to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

create policy "admins manage all user details"
    on public.user_details for all
    to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

create policy "admins manage all dives"
    on public.dives for all
    to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

create policy "admins manage all dive sites"
    on public.dive_sites for all
    to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

create policy "admins manage all dive photos"
    on public.dive_photos for all
    to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

create policy "admins manage all certifications"
    on public.certifications for all
    to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

create policy "admins manage all certification tags"
    on public.certification_tags for all
    to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

create policy "admins manage all dive plans"
    on public.dive_plans for all
    to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

create policy "admins manage all plan packing items"
    on public.plan_packing_items for all
    to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));

create policy "admins manage all regulators"
    on public.regulators for all
    to authenticated
    using ((select public.is_admin()))
    with check ((select public.is_admin()));
