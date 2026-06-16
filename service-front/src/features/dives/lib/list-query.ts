// サーバー（Server Components）とブラウザ（react-query）の両方から
// 使うため、'use client' / 'server-only' は付けない。
import type { Database } from '@repo/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

import { DIVE_PAGE_SIZE } from '@/features/dives/constants';
import type { DiveCursor, DiveListFilter, DiveListItem, DiveListPage, DiveSiteRef } from '@/features/dives/types';
import { toNumber } from '@/shared/lib/number';

/** 一覧表示で取得する列。`DiveListItem` と 1:1 で対応させる（表示名解決のため dive_site を結合） */
export const DIVE_LIST_COLUMNS =
    'id, dive_number, dive_date, location, dive_site_id, max_depth_m, bottom_time_min, water_temp_c, visibility_m, certification_dive, dive_site:dive_sites(id, name, area)';

type DiveRow = Database['public']['Tables']['dives']['Row'];

/** DIVE_LIST_COLUMNS で取得した行（生成型のサブセット + 結合した dive_site） */
type DiveListRow = Pick<
    DiveRow,
    | 'id'
    | 'dive_number'
    | 'dive_date'
    | 'location'
    | 'dive_site_id'
    | 'max_depth_m'
    | 'bottom_time_min'
    | 'water_temp_c'
    | 'visibility_m'
    | 'certification_dive'
> & { dive_site: DiveSiteRef | null };

/**
 * DB の snake_case 行を一覧表示用の camelCase に変換する。
 * numeric カラムは Supabase 経由で string になることがあるため数値へ正規化する。
 */
export const mapDiveListItem = (row: DiveListRow): DiveListItem => ({
    id: row.id,
    diveNumber: row.dive_number,
    diveDate: row.dive_date,
    location: row.location,
    diveSite: row.dive_site
        ? { id: row.dive_site.id, name: row.dive_site.name, area: row.dive_site.area }
        : null,
    maxDepthM: Number(row.max_depth_m),
    bottomTimeMin: row.bottom_time_min,
    waterTempC: toNumber(row.water_temp_c),
    visibilityM: toNumber(row.visibility_m),
    certificationDive: row.certification_dive,
});

export interface DiveListQueryOptions {
    filter?: DiveListFilter;
    cursor?: DiveCursor | null;
    limit?: number;
}

/**
 * 自分の dives を日付降順で取得する（サーバー・ブラウザ共用）。
 * キーセットページネーション（(dive_date, id) の複合カーソル）対応。
 * Supabase エラー時は throw する。
 */
export const fetchDiveListPage = async (
    supabase: SupabaseClient<Database>,
    options: DiveListQueryOptions = {},
): Promise<DiveListPage> => {
    const { filter, cursor, limit = DIVE_PAGE_SIZE } = options;

    let query = supabase
        .from('dives')
        .select(DIVE_LIST_COLUMNS)
        .order('dive_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1);

    if (filter?.diveNumber !== undefined) query = query.eq('dive_number', filter.diveNumber);
    if (filter?.diveDate) query = query.eq('dive_date', filter.diveDate);
    // ポイント名検索（FR-013）: 自由入力名（location）と参照サイト名の双方に一致させる。
    // サイト参照ログは location が null のため、名前が一致するサイト ID を先に引いて OR で合流する。
    if (filter?.location) {
        const keyword = filter.location;
        const { data: matchedSites } = await supabase.from('dive_sites').select('id').ilike('name', `%${keyword}%`);
        const siteIds = (matchedSites ?? []).map((site) => site.id);
        // or() は raw フィルタ文字列のため予約文字を除去し、ワイルドカードは * を使う
        const safeKeyword = keyword.replace(/[,()*"]/g, '');
        const orParts = [`location.ilike.*${safeKeyword}*`];
        if (siteIds.length > 0) orParts.push(`dive_site_id.in.(${siteIds.join(',')})`);
        query = query.or(orParts.join(','));
    }

    if (cursor) {
        /** (dive_date, id) の降順タプル比較を or で表現 */
        query = query.or(`dive_date.lt.${cursor.diveDate},and(dive_date.eq.${cursor.diveDate},id.lt.${cursor.id})`);
    }

    const { data, error } = await query;
    if (error || !data) {
        throw new Error(`dives の一覧取得に失敗しました: ${error?.message ?? 'no data'}`);
    }

    const rows = data as unknown as DiveListRow[];
    const hasNext = rows.length > limit;
    const items = (hasNext ? rows.slice(0, limit) : rows).map(mapDiveListItem);

    const last = items.at(-1);
    const nextCursor = hasNext && last ? { diveDate: last.diveDate, id: last.id } : null;

    return { items, nextCursor };
};
