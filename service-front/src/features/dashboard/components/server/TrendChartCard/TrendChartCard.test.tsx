import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TrendChartCard } from './TrendChartCard';

const baseProps = {
    title: '年別ダイビング本数',
    table: {
        keyHeader: '年',
        valueHeader: '本数',
        rows: [
            { key: '2025', value: '24 本' },
            { key: '2026', value: '11 本' },
        ],
    },
};

describe('TrendChartCard', () => {
    it('h3 見出しを表示する', () => {
        render(
            <TrendChartCard {...baseProps}>
                <svg role="img" aria-label="チャート" />
            </TrendChartCard>,
        );
        expect(screen.getByRole('heading', { level: 3, name: '年別ダイビング本数' })).toBeInTheDocument();
    });

    it('children（チャート）を描画する', () => {
        render(
            <TrendChartCard {...baseProps}>
                <svg role="img" aria-label="チャート" />
            </TrendChartCard>,
        );
        expect(screen.getByRole('img', { name: 'チャート' })).toBeInTheDocument();
    });

    it('「データを表で見る」の details に代替データテーブルを持つ', async () => {
        const user = userEvent.setup();
        render(
            <TrendChartCard {...baseProps}>
                <svg role="img" aria-label="チャート" />
            </TrendChartCard>,
        );

        // summary はキーボード操作（Enter）で開閉できる native 要素
        const summary = screen.getByText('データを表で見る');
        await user.click(summary);

        const table = screen.getByRole('table');
        expect(table).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: '年' })).toBeInTheDocument();
        expect(screen.getByRole('columnheader', { name: '本数' })).toBeInTheDocument();
        expect(screen.getByRole('rowheader', { name: '2025' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: '24 本' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: '11 本' })).toBeInTheDocument();
    });
});
