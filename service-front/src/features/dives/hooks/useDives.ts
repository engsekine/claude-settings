'use client';

import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';

import { fetchDiveListPage } from '@/features/dives/lib/list-query';
import type { DiveCursor, DiveListFilter, DiveListPage } from '@/features/dives/types';
import { createClient } from '@/shared/lib/supabase/browser';

const isEmptyFilter = (filter: DiveListFilter): boolean =>
    filter.diveNumber === undefined && !filter.diveDate && !filter.location;

/**
 * dives 一覧の検索 + 追加読み込みフック。
 * filter が空（初期状態）のとき、SSR で取得した initialPage を初期キャッシュに流し込み、
 * 余計なクライアントフェッチが走らないようにする。
 */
export const useDives = (filter: DiveListFilter, initialPage?: DiveListPage) => {
    const initialData: InfiniteData<DiveListPage, DiveCursor | null> | undefined =
        initialPage && isEmptyFilter(filter) ? { pages: [initialPage], pageParams: [null] } : undefined;

    return useInfiniteQuery({
        queryKey: ['dives', filter],
        queryFn: ({ pageParam }) => fetchDiveListPage(createClient(), { filter, cursor: pageParam }),
        initialPageParam: null as DiveCursor | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        ...(initialData ? { initialData } : {}),
    });
};
