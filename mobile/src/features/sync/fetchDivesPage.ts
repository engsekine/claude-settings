import { supabase } from '../../lib/supabase/client';
import type { FetchDivesPage, ServerDiveRow } from './lib/fullSync';

/**
 * dives の keyset ページ取得（fullSync / 機会的リフレッシュ共用）。
 * RLS により本人のログのみ。論理削除済みは除外する。
 */
export const fetchDivesPage: FetchDivesPage = async (cursor, limit) => {
    let query = supabase
        .from('dives')
        .select('*')
        .is('deleted_at', null)
        .order('dive_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit);
    if (cursor) {
        query = query.or(`dive_date.lt.${cursor.diveDate},and(dive_date.eq.${cursor.diveDate},id.lt.${cursor.id})`);
    }
    const { data, error } = await query;
    if (error) throw new Error(`ログの取得に失敗しました: ${error.message}`);
    return (data ?? []) as unknown as ServerDiveRow[];
};
