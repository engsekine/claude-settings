-- ========================================
-- 利用者向け参照からソフトデリート済みを除外する（FR-016 / クロスアプリ T060）
-- 管理画面の論理削除（deleted_at）を service-front の利用者表示に反映する。
-- 管理者向けポリシー（admins manage all ...）は deleted_at を除外しない
-- （復元のため削除済みも参照できる必要がある）。
-- ========================================

-- dives: 利用者は自分の「未削除」ログのみ参照可
drop policy if exists "users can read own dives" on public.dives;
create policy "users can read own dives"
    on public.dives for select
    using ((select auth.uid()) = user_id and deleted_at is null);

-- dive_sites: 認証済みは「未削除」サイトのみ参照可
drop policy if exists "authenticated can read dive sites" on public.dive_sites;
create policy "authenticated can read dive sites"
    on public.dive_sites for select
    to authenticated
    using (deleted_at is null);

-- dive_photos: 自分の「未削除」写真のみ参照可
drop policy if exists "users can read own dive photos" on public.dive_photos;
create policy "users can read own dive photos"
    on public.dive_photos for select
    using ((select auth.uid()) = user_id and deleted_at is null);

-- dive_photos: 公開ダイブの「未削除」写真のみ参照可（写真・親ログとも未削除）
drop policy if exists "anyone can read public dive photos" on public.dive_photos;
create policy "anyone can read public dive photos"
    on public.dive_photos for select
    using (
        deleted_at is null
        and exists (
            select 1
            from public.dives d
            where d.id = dive_id
              and d.is_public
              and d.deleted_at is null
        )
    );
