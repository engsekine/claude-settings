-- ========================================
-- dive-photos バケットの Storage RLS ポリシー
-- 本人は自分の {user_id}/... 配下を全操作可。
-- display/thumb は「パスの dive_id が公開中の dive なら」誰でも（anon 含む）参照可。
-- orig は anon から常に不可（多層防御。原本は処理後に削除される）。
-- 仕様: specs/012-photo-attachments/data-model.md / contracts/storage-layout.md
-- ========================================

-- パス（{user_id}/{dive_id}/{kind}/{photo_id}.{ext}）の 2 階層目 dive_id を取り出し、
-- その dive が公開中かを返す判定関数。ポリシー式から参照する。
create or replace function public.is_public_dive_photo(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
    select exists (
        select 1
        from public.dives d
        where d.id = (split_part(object_name, '/', 2))::uuid
          and d.is_public
    );
$$;

comment on function public.is_public_dive_photo(text) is
    'dive-photos の Storage パスから dive_id を取り出し、その dive が公開中かを返す（Storage RLS 用）';

-- 本人: 自分の user_id 配下（パス先頭）を全操作可
create policy "owner can manage own dive photo objects"
    on storage.objects for all
    to authenticated
    using (
        bucket_id = 'dive-photos'
        and (select auth.uid())::text = (storage.foldername(name))[1]
    )
    with check (
        bucket_id = 'dive-photos'
        and (select auth.uid())::text = (storage.foldername(name))[1]
    );

-- 公開: display / thumb かつ公開 dive のオブジェクトのみ anon / authenticated が参照可
create policy "public can read display of public dives"
    on storage.objects for select
    to anon, authenticated
    using (
        bucket_id = 'dive-photos'
        and (storage.foldername(name))[3] in ('display', 'thumb')
        and public.is_public_dive_photo(name)
    );
