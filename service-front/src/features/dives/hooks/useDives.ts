'use client';

import { type InfiniteData, useInfiniteQuery } from '@tanstack/react-query';

import { fetchDiveListPage } from '@/features/dives/lib/list-query';
import { isSameFilter } from '@/features/dives/lib/search-params';
import type { DiveCursor, DiveListFilter, DiveListPage } from '@/features/dives/types';
import { createClient } from '@/shared/lib/supabase/browser';

/**
 * dives 一覧の検索 + 追加読み込みフック。
 * 現在の filter が SSR 取得時の initialFilter と一致するとき、SSR で取得した initialPage を
 * 初期キャッシュに流し込み、余計なクライアントフェッチが走らないようにする。
 */
export const useDives = (filter: DiveListFilter, initialPage?: DiveListPage, initialFilter: DiveListFilter = {}) => {
    const initialData: InfiniteData<DiveListPage, DiveCursor | null> | undefined =
        initialPage && isSameFilter(filter, initialFilter) ? { pages: [initialPage], pageParams: [null] } : undefined;

    return useInfiniteQuery({
        queryKey: ['dives', filter],
        queryFn: ({ pageParam }) => fetchDiveListPage(createClient(), { filter, cursor: pageParam }),
        initialPageParam: null as DiveCursor | null,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        ...(initialData ? { initialData } : {}),
    });
};
