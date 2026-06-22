'use client';

import { Button } from '@repo/ui/components/button';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

interface PaginationProps {
    page: number;
    perPage: number;
    total: number;
}

/** サーバーページング用のページャ。page クエリを URL に同期する */
export const Pagination = ({ page, perPage, total }: PaginationProps) => {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();

    const totalPages = Math.max(1, Math.ceil(total / perPage));
    const start = total === 0 ? 0 : (page - 1) * perPage + 1;
    const end = Math.min(page * perPage, total);

    const goToPage = (next: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('page', String(next));
        router.push(`${pathname}?${params.toString()}`);
    };

    return (
        <nav aria-label="ページネーション" className="flex items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm" aria-live="polite">
                {total}件中 {start}〜{end}件
            </p>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
                    前へ
                </Button>
                <span className="self-center text-sm">
                    {page} / {totalPages}
                </span>
                <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => goToPage(page + 1)}>
                    次へ
                </Button>
            </div>
        </nav>
    );
};
