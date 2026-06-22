import type { Database } from '@repo/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { ListParams, ResourceListResult } from './types';

type AdminClient = SupabaseClient<Database>;
type PublicTable = keyof Database['public']['Tables'] & string;

/**
 * 汎用一覧取得（contracts/admin-resource.md）。
 * サーバーページング（range + exact count）・必要カラムのみ select・
 * キーワード検索・並び替え（許可リスト）・deleted_at is null 既定 を適用する。
 *
 * 並び替え/検索カラムは呼び出し側が許可リストで限定する（任意カラム injection 防止）。
 */
export const listResource = async <Row>(
    supabase: AdminClient,
    table: PublicTable,
    columns: string,
    params: ListParams,
): Promise<ResourceListResult<Row>> => {
    const { page, perPage } = params;
    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    let query = supabase.from(table).select(columns, { count: 'exact' });

    if (params.hasDeletedAt && !params.includeDeleted) {
        query = query.is('deleted_at', null);
    }

    if (params.search && params.searchColumns && params.searchColumns.length > 0) {
        // PostgREST の or() はフィルタ文字列をサーバー側でパースするため、検索語に
        // カンマ・括弧・ilike ワイルドカード(%, _)が含まれるとフィルタ構文を壊し得る。
        // それらを除去してから埋め込む（searchColumns は呼び出し側の許可リストなので安全）。
        const safeSearch = params.search.replace(/[%_,()\\]/g, ' ').trim();
        if (safeSearch) {
            const orExpr = params.searchColumns.map((column) => `${column}.ilike.%${safeSearch}%`).join(',');
            query = query.or(orExpr);
        }
    }

    if (params.sort && params.sortableColumns?.includes(params.sort.column)) {
        query = query.order(params.sort.column, { ascending: params.sort.ascending });
    }

    const { data, error, count } = await query.range(from, to);
    if (error) throw error;

    return {
        rows: (data ?? []) as unknown as Row[],
        total: count ?? 0,
        page,
        perPage,
    };
};
