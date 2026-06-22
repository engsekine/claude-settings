-- ========================================
-- 最後の上位管理者（superadmin）の喪失を DB レベルで防ぐ（FR-015）
-- アプリ層（deactivateAdmin）でもチェックするが、同時実行の競合（TOCTOU）で
-- superadmin が 0 人になるのを防ぐため、トリガで原子的に担保する。
-- ========================================

create or replace function public.prevent_last_superadmin_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
    other_active_superadmins integer;
begin
    -- 有効な superadmin が「無効化」または「降格」されようとしているか
    if (old.role = 'superadmin' and old.deleted_at is null)
       and (new.deleted_at is not null or new.role <> 'superadmin') then
        -- 自分以外の有効な superadmin を行ロックして同時実行を直列化する。
        -- count(*) は FOR UPDATE と併用できないため、PERFORM でロック取得 → ROW_COUNT で件数を得る。
        perform 1
        from public.admin_users
        where role = 'superadmin'
          and deleted_at is null
          and id <> old.id
        for update;
        get diagnostics other_active_superadmins = row_count;

        if other_active_superadmins = 0 then
            raise exception '最後の上位管理者は無効化・降格できません';
        end if;
    end if;
    return new;
end;
$$;

create trigger admin_users_prevent_last_superadmin
    before update on public.admin_users
    for each row
    execute function public.prevent_last_superadmin_removal();
