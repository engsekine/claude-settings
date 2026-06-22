import type { Database } from '@repo/supabase';

import { requireAdmin } from '@/features/admin-auth';
import { listResource } from '@/shared/lib/resource/queries';
import type { ListParams, ResourceListResult } from '@/shared/lib/resource/types';
import { createClient } from '@/shared/lib/supabase/server';

type UserDetailRow = Database['public']['Tables']['user_details']['Row'];

/** 一覧表示に使うユーザーの主要項目（user_details 起点。1 ユーザー 1 行） */
export type UserListRow = Pick<UserDetailRow, 'user_id' | 'nickname' | 'last_name' | 'first_name' | 'created_at'>;

/** 詳細表示に使うプロフィール項目（個人情報の過剰露出を避け必要分のみ / FR-017） */
export type UserDetailRowView = Pick<
    UserDetailRow,
    | 'user_id'
    | 'nickname'
    | 'last_name'
    | 'first_name'
    | 'last_name_romaji'
    | 'first_name_romaji'
    | 'birth_on'
    | 'gender'
    | 'created_at'
>;

/** ユーザー詳細（プロフィール + 関連サマリ） */
export interface UserDetailView {
    detail: UserDetailRowView;
    diveCount: number;
}

export const USER_SEARCH_COLUMNS = ['nickname', 'last_name', 'first_name'] as const;
export const USER_SORTABLE_COLUMNS = ['created_at', 'nickname'] as const;

const LIST_COLUMNS = 'user_id, nickname, last_name, first_name, created_at';

/** ユーザー一覧（user_details 起点。created_at = 登録日相当） */
export const listUsers = async (
    params: Pick<ListParams, 'page' | 'perPage' | 'search' | 'sort'>,
): Promise<ResourceListResult<UserListRow>> => {
    await requireAdmin();
    const supabase = await createClient();

    return listResource<UserListRow>(supabase, 'user_details', LIST_COLUMNS, {
        ...params,
        searchColumns: USER_SEARCH_COLUMNS,
        sortableColumns: USER_SORTABLE_COLUMNS,
        hasDeletedAt: false,
    });
};

/** ユーザー詳細 + ダイブログ件数（関連サマリ / FR-008）。該当なしは null */
export const getUserDetail = async (userId: string): Promise<UserDetailView | null> => {
    await requireAdmin();
    const supabase = await createClient();

    const { data: detail, error } = await supabase
        .from('user_details')
        .select(
            'user_id, nickname, last_name, first_name, last_name_romaji, first_name_romaji, birth_on, gender, created_at',
        )
        .eq('user_id', userId)
        .maybeSingle();
    if (error) throw error;
    if (!detail) return null;

    const { count, error: countError } = await supabase
        .from('dives')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('deleted_at', null);
    if (countError) throw countError;

    return { detail, diveCount: count ?? 0 };
};
