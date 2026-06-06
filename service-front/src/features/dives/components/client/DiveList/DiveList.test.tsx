import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

vi.mock('@/shared/lib/supabase/browser', () => ({
    createClient: () => ({
        from: () => ({
            select: () => ({
                order: () => ({
                    order: () => ({
                        limit: () => ({
                            or: () => Promise.resolve({ data: [], error: null }),
                            gte: () => Promise.resolve({ data: [], error: null }),
                            lte: () => Promise.resolve({ data: [], error: null }),
                            ilike: () => Promise.resolve({ data: [], error: null }),
                            // biome-ignore lint/suspicious/noThenProperty: Supabase クエリビルダーは thenable のため、モックでも then を実装する必要がある
                            then: (resolve: (v: { data: unknown[]; error: null }) => void) =>
                                resolve({ data: [], error: null }),
                        }),
                    }),
                }),
            }),
        }),
    }),
}));

import { DiveList } from './DiveList';

const wrapper = ({ children }: { children: ReactNode }) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
};

describe('DiveList', () => {
    it('initialPage が空のとき空状態 CTA を表示する', () => {
        render(<DiveList initialPage={{ items: [], nextCursor: null }} />, { wrapper });

        expect(screen.getByText('ログがまだありません')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '最初のログを記録しよう' })).toHaveAttribute('href', '/dives/new');
    });

    it('initialPage にデータがあるとカードリストを表示する', () => {
        render(
            <DiveList
                initialPage={{
                    items: [
                        {
                            id: 'd1',
                            diveNumber: 1,
                            diveDate: '2026-04-15',
                            location: '伊豆 / 大瀬崎',
                            maxDepthM: 18,
                            bottomTimeMin: 40,
                            waterTempC: null,
                            visibilityM: null,
                            certificationDive: false,
                        },
                    ],
                    nextCursor: null,
                }}
            />,
            { wrapper },
        );

        expect(screen.getByRole('heading', { level: 2, name: '伊豆 / 大瀬崎' })).toBeInTheDocument();
    });
});
