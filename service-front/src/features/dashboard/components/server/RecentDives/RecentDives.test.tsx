import { render, screen, within } from '@testing-library/react';

import type { RecentDiveItem } from '@/features/dashboard/types';

import { RecentDives } from './RecentDives';

const buildDive = (overrides: Partial<RecentDiveItem> = {}): RecentDiveItem => ({
    id: 'dive-1',
    diveDate: '2026-05-20',
    location: '石垣島・米原',
    maxDepthM: 18.5,
    bottomTimeMin: 42,
    ...overrides,
});

describe('RecentDives', () => {
    describe('ログがあるとき', () => {
        it('日付・ポイント名・最大水深・潜水時間を表示する', () => {
            render(<RecentDives dives={[buildDive()]} />);
            const item = within(screen.getByRole('listitem'));
            expect(item.getByText('2026/05/20')).toBeInTheDocument();
            expect(item.getByText('石垣島・米原')).toBeInTheDocument();
            expect(item.getByText('18.5m')).toBeInTheDocument();
            expect(item.getByText('42分')).toBeInTheDocument();
        });

        it('各行は詳細ページへのリンクになっている', () => {
            render(<RecentDives dives={[buildDive({ id: 'dive-abc' })]} />);
            expect(screen.getByRole('link', { name: /石垣島・米原/ })).toHaveAttribute('href', '/dives/dive-abc');
        });

        it('「すべてのログを見る」リンクを表示する', () => {
            render(<RecentDives dives={[buildDive()]} />);
            expect(screen.getByRole('link', { name: 'すべてのログを見る' })).toHaveAttribute('href', '/dives');
        });

        it('6 件以上渡されても表示は 5 件まで', () => {
            const dives = Array.from({ length: 7 }, (_, i) => buildDive({ id: `dive-${i}`, location: `ポイント${i}` }));
            render(<RecentDives dives={dives} />);
            expect(screen.getAllByRole('listitem')).toHaveLength(5);
            expect(screen.queryByText('ポイント5')).not.toBeInTheDocument();
        });
    });

    describe('ログが 0 件のとき', () => {
        it('空メッセージと新規作成 CTA を表示する', () => {
            render(<RecentDives dives={[]} />);
            expect(screen.getByText('ログがまだありません')).toBeInTheDocument();
            expect(screen.getByRole('link', { name: '最初のログを記録しよう' })).toHaveAttribute('href', '/dives/new');
        });

        it('リストと「すべてのログを見る」リンクは表示しない', () => {
            render(<RecentDives dives={[]} />);
            expect(screen.queryByRole('list')).not.toBeInTheDocument();
            expect(screen.queryByRole('link', { name: 'すべてのログを見る' })).not.toBeInTheDocument();
        });
    });
});
