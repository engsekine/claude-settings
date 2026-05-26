'use client';

import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';

import { DIVE_PAGE_SIZE } from '@/features/dives/constants';
import type { DiveCursor, DiveListFilter, DiveListPage } from '@/features/dives/types';
import { createClient } from '@/shared/lib/supabase/browser';

interface FetchPageArgs {
    filter: DiveListFilter;
    cursor: DiveCursor | null;
}

const LIST_COLUMNS =
    'id, dive_number, dive_date, location, dive_site, max_depth_m, bottom_time_min, water_temp_c, visibility_m, certification_dive';

const fetchDivesPage = async ({ filter, cursor }: FetchPageArgs): Promise<DiveListPage> => {
    const supabase = createClient();
    let query = supabase
        .from('dives')
        .select(LIST_COLUMNS)
        .order('dive_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(DIVE_PAGE_SIZE + 1);

    if (filter.dateFrom) query = query.gte('dive_date', filter.dateFrom);
    if (filter.dateTo) query = query.lte('dive_date', filter.dateTo);
    if (filter.location) query = query.ilike('location', `%${filter.location}%`);

    if (cursor) {
        query = query.or(
            `dive_date.lt.${cursor.diveDate},and(dive_date.eq.${cursor.diveDate},id.lt.${cursor.id})`,
        );
    }

    const { data, error } = await query;
    if (error || !data) {
        throw new Error(error?.message ?? 'failed to fetch dives');
    }

    const rows = data as Array<{
        id: string;
        dive_number: number | null;
        dive_date: string;
        location: string;
        dive_site: string | null;
        max_depth_m: number | string;
        bottom_time_min: number;
        water_temp_c: number | string | null;
        visibility_m: number | string | null;
        certification_dive: boolean;
    }>;

    const hasNext = rows.length > DIVE_PAGE_SIZE;
    const items = (hasNext ? rows.slice(0, DIVE_PAGE_SIZE) : rows).map((row) => ({
        id: row.id,
        diveNumber: row.dive_number,
        diveDate: row.dive_date,
        location: row.location,
        diveSite: row.dive_site,
        maxDepthM: Number(row.max_depth_m),
        bottomTimeMin: row.bottom_time_min,
        waterTempC: row.water_temp_c === null ? null : Number(row.water_temp_c),
        visibilityM: row.visibility_m === null ? null : Number(row.visibility_m),
        certificationDive: row.certification_dive,
    }));

    const last = items.at(-1);
    return {
        items,
        nextCursor: hasNext && last ? { diveDate: last.diveDate, id: last.id } : null,
    };
};

const isEmptyFilter = (filter: DiveListFilter): boolean =>
    !filter.dateFrom && !filter.dateTo && !filter.location;

/**
 * dives 一覧の検索 + 追加読み込みフック。
 * filter が空（初期状態）のとき、SSR で取得した initialPage を初期キャッシュに流し込み、
 * 余計なクライアントフェッチが走らないようにする。
 */
export const useDives = (filter: DiveListFilter, initialPage?: DiveListPage) => {
    const initialData: InfiniteData<DiveListPage, DiveCursor | null> | undefined =
        initialPage && isEmptyFilter(filter)
            ? { pages: [initialPage], pageParams: [null] }
            : undefined;

    return useInfiniteQuery({
        queryKey: ['dives', filter],
        queryFn: ({ pageParam }) => fetchDivesPage({ filter, cursor: pageParam }),
        initialPageParam: null as DiveCursor | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        initialData,
    });
};
