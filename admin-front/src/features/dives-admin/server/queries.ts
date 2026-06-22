import type { Database } from '@repo/supabase';

import { requireAdmin } from '@/features/admin-auth';
import { listResource } from '@/shared/lib/resource/queries';
import type { ListParams, ResourceListResult } from '@/shared/lib/resource/types';
import { createClient } from '@/shared/lib/supabase/server';

type DiveFullRow = Database['public']['Tables']['dives']['Row'];

/** 一覧表示に使うダイブログの主要項目 */
export type DiveListRow = Pick<
    DiveFullRow,
    'id' | 'user_id' | 'dive_date' | 'location' | 'max_depth_m' | 'created_at'
>;

export const DIVE_SEARCH_COLUMNS = ['location', 'buddy_name'] as const;
export const DIVE_SORTABLE_COLUMNS = ['dive_date', 'created_at', 'max_depth_m'] as const;

const LIST_COLUMNS = 'id, user_id, dive_date, location, max_depth_m, created_at';

/** ダイブログ一覧（管理者のみ・ソフトデリート除外） */
export const listDives = async (
    params: Pick<ListParams, 'page' | 'perPage' | 'search' | 'sort'>,
): Promise<ResourceListResult<DiveListRow>> => {
    await requireAdmin();
    const supabase = await createClient();

    return listResource<DiveListRow>(supabase, 'dives', LIST_COLUMNS, {
        ...params,
        searchColumns: DIVE_SEARCH_COLUMNS,
        sortableColumns: DIVE_SORTABLE_COLUMNS,
        hasDeletedAt: true,
    });
};

/** ダイブログ詳細（全項目）。該当なしは null */
export const getDiveDetail = async (id: string): Promise<DiveFullRow | null> => {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase.from('dives').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
};
