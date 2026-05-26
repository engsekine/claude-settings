'use client';

import { Button } from '@repo/ui/components/button';
import Link from 'next/link';
import { useState } from 'react';

import { DiveCard } from '@/features/dives/components/client/DiveCard';
import { DiveSearchBar } from '@/features/dives/components/client/DiveSearchBar';
import { useDives } from '@/features/dives/hooks/useDives';
import type { DiveListFilter, DiveListPage } from '@/features/dives/types';

interface DiveListProps {
    /** SSR で取得した初回（フィルタなし）データ */
    initialPage: DiveListPage;
}

export const DiveList = ({ initialPage }: DiveListProps) => {
    const [filter, setFilter] = useState<DiveListFilter>({});

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isError } = useDives(filter, initialPage);

    const pages = data?.pages ?? [];
    const items = pages.flatMap((page) => page.items);

    if (items.length === 0) {
        return (
            <div className="flex flex-col gap-4">
                <DiveSearchBar initialFilter={filter} onSubmit={setFilter} />
                <div className="flex flex-col items-center gap-3 rounded-lg border border-border border-dashed bg-background p-12 text-center">
                    <p className="text-muted-foreground">ログがまだありません</p>
                    <Link
                        href="/dives/new"
                        className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm transition-opacity hover:opacity-90"
                    >
                        最初のログを記録しよう
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            <DiveSearchBar initialFilter={filter} onSubmit={setFilter} />

            {isError && (
                <p role="alert" className="text-red-600 text-sm">
                    ログの取得に失敗しました。時間をおいて再度お試しください
                </p>
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
