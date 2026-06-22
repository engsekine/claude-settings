import type { Database } from '@repo/supabase';

import { requireAdmin } from '@/features/admin-auth';
import { listResource } from '@/shared/lib/resource/queries';
import type { ListParams, ResourceListResult } from '@/shared/lib/resource/types';
import { createClient } from '@/shared/lib/supabase/server';

export type DiveSiteFullRow = Database['public']['Tables']['dive_sites']['Row'];

/** 一覧表示に使うダイブサイトの主要項目 */
export type DiveSiteListRow = Pick<DiveSiteFullRow, 'id' | 'name' | 'area' | 'country' | 'created_at'>;

export const DIVE_SITE_SEARCH_COLUMNS = ['name', 'area'] as const;
export const DIVE_SITE_SORTABLE_COLUMNS = ['name', 'created_at'] as const;

const LIST_COLUMNS = 'id, name, area, country, created_at';

/** ダイブサイト一覧（管理者のみ・ソフトデリート除外） */
export const listDiveSites = async (
    params: Pick<ListParams, 'page' | 'perPage' | 'search' | 'sort'>,
): Promise<ResourceListResult<DiveSiteListRow>> => {
    await requireAdmin();
    const supabase = await createClient();

    return listResource<DiveSiteListRow>(supabase, 'dive_sites', LIST_COLUMNS, {
        ...params,
        searchColumns: DIVE_SITE_SEARCH_COLUMNS,
        sortableColumns: DIVE_SITE_SORTABLE_COLUMNS,
        hasDeletedAt: true,
    });
};

/** ダイブサイト詳細（編集フォーム用）。該当なしは null */
export const getDiveSiteDetail = async (id: string): Promise<DiveSiteFullRow | null> => {
    await requireAdmin();
    const supabase = await createClient();

    const { data, error } = await supabase.from('dive_sites').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
};

/** このサイトを参照しているダイブログ件数（物理削除前の参照整合性チェック / FR-014） */
export const countReferencingDives = async (siteId: string): Promise<number> => {
    await requireAdmin();
    const supabase = await createClient();

    const { count, error } = await supabase
        .from('dives')
        .select('id', { count: 'exact', head: true })
        .eq('dive_site_id', siteId);
    if (error) throw error;
    return count ?? 0;
};
