import { requireAdmin } from '@/features/admin-auth';
import { listResource } from '@/shared/lib/resource/queries';
import type { ListParams, ResourceListResult } from '@/shared/lib/resource/types';
import { createClient } from '@/shared/lib/supabase/server';

import { ALLOWED_TABLES, isAllowedTable } from '../constants';

/** 汎用テーブルの行（カラムは実行時に動的決定するため緩く型付け） */
export type GenericRow = Record<string, unknown>;

/**
 * 許可リストのテーブルを汎用的に一覧取得する（FR-017）。
 * 許可されていないテーブル名はエラーにして弾く（auth / admin / 内部の露出防止）。
 */
export const listTableRows = async (
    table: string,
    params: Pick<ListParams, 'page' | 'perPage' | 'search' | 'sort'>,
): Promise<ResourceListResult<GenericRow>> => {
    await requireAdmin();
    if (!isAllowedTable(table)) {
        throw new Error(`許可されていないテーブルです: ${table}`);
    }
    const config = ALLOWED_TABLES[table];
    const supabase = await createClient();

    return listResource<GenericRow>(supabase, table, '*', {
        ...params,
        searchColumns: config.searchColumns,
        sortableColumns: config.sortableColumns,
        hasDeletedAt: config.hasDeletedAt,
    });
};
