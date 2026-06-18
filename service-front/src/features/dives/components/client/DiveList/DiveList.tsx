'use client';

import { Button } from '@repo/ui/components/button';
import type { Route } from 'next';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

import { DiveCard } from '@/features/dives/components/client/DiveCard';
import { DiveSearchBar } from '@/features/dives/components/client/DiveSearchBar';
import { useDives } from '@/features/dives/hooks/useDives';
import { filterToSearchParams, isSameFilter } from '@/features/dives/lib/search-params';
import type { DiveListFilter, DiveListPage } from '@/features/dives/types';

interface DiveListProps {
    /** SSR で取得した初回データ（initialFilter に対応） */
    initialPage: DiveListPage;
    /** SSR 取得時に使われたフィルタ（URL クエリ由来）。未指定は空フィルタ */
    initialFilter?: DiveListFilter;
}

export const DiveList = ({ initialPage, initialFilter = {} }: DiveListProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const [filter, setFilter] = useState<DiveListFilter>(initialFilter);

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isError } = useDives(
        filter,
        initialPage,
        initialFilter,
    );

    const pages = data?.pages ?? [];
    const items = pages.flatMap((page) => page.items);
    const hasActiveFilter = !isSameFilter(filter, {});

    /** フィルタ適用時に state と URL クエリを同期する（再読み込み・共有で復元可能に） */
    const handleApplyFilter = (next: DiveListFilter) => {
        setFilter(next);
        const query = filterToSearchParams(next).toString();
        const target = (query ? `${pathname}?${query}` : pathname) as Route;
        router.replace(target, { scroll: false });
    };

    return (
        <div className="flex flex-col gap-4">
            {/* 適用中フィルタが外部から変わった（解除導線など）ときに入力値・開閉状態を確実に追従させるため、
                key に適用フィルタを与えて再マウントする。キー入力中は適用フィルタが変わらないため再マウントしない。 */}
            <DiveSearchBar
                key={filterToSearchParams(filter).toString()}
                initialFilter={filter}
                onSubmit={handleApplyFilter}
            />

            {isError && (
                <p role="alert" className="text-red-600 text-sm">
                    ログの取得に失敗しました。時間をおいて再度お試しください。
                </p>
            )}

            {items.length === 0 && hasActiveFilter && (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-border border-dashed bg-background p-8 text-center">
                    <p className="text-muted-foreground">検索条件に一致するログはありません</p>
                    <Button type="button" variant="outline" onClick={() => handleApplyFilter({})}>
                        フィルタを解除して全件表示
                    </Button>
                </div>
            )}

            {items.length === 0 && !hasActiveFilter && (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-border border-dashed bg-background p-12 text-center">
                    <p className="text-muted-foreground">ログがまだありません</p>
                    <Link
                        href="/dives/new"
                        className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm transition-opacity hover:opacity-90"
                    >
                        最初のログを記録しよう
                    </Link>
                </div>
            )}

            <ul className="flex flex-col gap-3">
                {items.map((dive) => (
                    <li key={dive.id}>
                        <DiveCard dive={dive} />
                    </li>
                ))}
            </ul>

            {hasNextPage && (
                <div className="flex justify-center">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                            void fetchNextPage();
                        }}
                        disabled={isFetchingNextPage}
                        aria-busy={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? '読み込み中...' : 'もっと見る'}
                    </Button>
                </div>
            )}
        </div>
    );
};
