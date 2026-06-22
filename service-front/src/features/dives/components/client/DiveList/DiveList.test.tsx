import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { vi } from 'vitest';

const replace = vi.fn();
vi.mock('next/navigation', () => ({
    useRouter: () => ({ replace }),
    usePathname: () => '/dives',
    useSearchParams: () => new URLSearchParams(),
}));

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
                            not: () => Promise.resolve({ data: [], error: null }),
                            eq: () => Promise.resolve({ data: [], error: null }),
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
    beforeEach(() => {
        replace.mockClear();
    });

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
                            diveSite: null,
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

    it('検索で複数フィルタを適用すると URL クエリへ同期する（FR-004 / FR-005 / FR-010）', async () => {
        const user = userEvent.setup();
        render(<DiveList initialPage={{ items: [], nextCursor: null }} />, { wrapper });

        await user.type(screen.getByLabelText('ダイブ番号'), '12');
        await user.click(screen.getByRole('button', { name: '詳細条件を開く' }));
        await user.type(screen.getByLabelText('開始日'), '2025-07-01');
        await user.selectOptions(screen.getByLabelText('ダイブタイプ'), 'boat');
        await user.click(screen.getByRole('button', { name: '検索' }));

        expect(replace).toHaveBeenCalledWith('/dives?number=12&date_from=2025-07-01&type=boat', { scroll: false });
    });

    it('フィルタ適用済みで 0 件のとき解除導線を出し、押すと全件 URL に戻す（FR-008 / SC-005）', async () => {
        const user = userEvent.setup();
        render(<DiveList initialPage={{ items: [], nextCursor: null }} initialFilter={{ diveType: 'boat' }} />, {
            wrapper,
        });

        expect(screen.getByText('検索条件に一致するログはありません')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'フィルタを解除して全件表示' }));

        expect(replace).toHaveBeenCalledWith('/dives', { scroll: false });
    });

    // 選択モードの操作中に背景 refetch（モックは空配列を返す）でカードが消えないよう、
    // initialData を fresh 扱いにする QueryClient を使う
    const freshWrapper = ({ children }: { children: ReactNode }) => {
        const client = new QueryClient({
            defaultOptions: { queries: { retry: false, staleTime: Number.POSITIVE_INFINITY } },
        });
        return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    };

    const oneItemPage = {
        items: [
            {
                id: 'd1',
                diveNumber: 1,
                diveDate: '2026-04-15',
                location: '伊豆 / 大瀬崎',
                diveSite: null,
                maxDepthM: 18,
                bottomTimeMin: 40,
                waterTempC: null,
                visibilityM: null,
                certificationDive: false,
            },
        ],
        nextCursor: null,
    };

    it('選択モードに入ると行チェックボックスと選択用エクスポートを表示する（US3）', async () => {
        const user = userEvent.setup();
        render(<DiveList initialPage={oneItemPage} />, { wrapper: freshWrapper });

        await user.click(screen.getByRole('button', { name: 'ログを選択してエクスポート' }));

        expect(screen.getByRole('checkbox', { name: /選択/ })).toBeInTheDocument();
        // 0 件選択時はエクスポート操作が無効
        expect(screen.getByRole('button', { name: 'エクスポート' })).toBeDisabled();
        expect(screen.getByRole('status')).toHaveTextContent('出力するログを選択してください');
    });

    it('ログを選択すると件数表示が更新されエクスポートが有効になる（US3）', async () => {
        const user = userEvent.setup();
        render(<DiveList initialPage={oneItemPage} />, { wrapper: freshWrapper });

        await user.click(screen.getByRole('button', { name: 'ログを選択してエクスポート' }));
        await user.click(screen.getByRole('checkbox', { name: /選択/ }));

        expect(screen.getByRole('status')).toHaveTextContent('1 件選択中');
        expect(screen.getByRole('button', { name: 'エクスポート' })).toBeEnabled();
    });
});
