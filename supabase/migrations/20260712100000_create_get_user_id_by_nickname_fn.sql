-- ニックネーム → user_id の解決（034 / FR-001・FR-002）。
-- 照合は一意インデックス user_details_nickname_key と同じ正規化（lower(trim())）で行い、
-- インデックスを利用する。user_details の RLS（本人のみ read）を越えるため security definer とし、
-- 返すのは user_id のみ（nickname は URL として既に公開情報のため漏えいの拡大はない）。
create or replace function public.get_user_id_by_nickname(p_nickname text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
    select user_id
    from public.user_details
    where lower(trim(nickname)) = lower(trim(p_nickname))
    limit 1;
$$;

comment on function public.get_user_id_by_nickname(text) is
    'プロフィール URL のニックネーム解決（034）。一意インデックスと同じ正規化で照合し user_id を返す';

-- 既定で PUBLIC に付与される EXECUTE を剥奪してから authenticated のみに付与する。
-- プロフィールページは認証必須（proxy の /users ガード）のため anon には付与しない
revoke all on function public.get_user_id_by_nickname(text) from public;
grant execute on function public.get_user_id_by_nickname(text) to authenticated;
