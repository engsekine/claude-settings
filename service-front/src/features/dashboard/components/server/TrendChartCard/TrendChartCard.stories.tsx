import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { TrendChartCard } from './TrendChartCard';

const meta = {
    title: 'features/dashboard/TrendChartCard',
    component: TrendChartCard,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof TrendChartCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 通常（チャート + 代替データテーブル） */
export const Default: Story = {
    args: {
        title: '年別ダイビング本数',
        table: {
            keyHeader: '年',
            valueHeader: '本数',
            rows: [
                { key: '2024', value: '18 本' },
                { key: '2025', value: '24 本' },
                { key: '2026', value: '11 本' },
            ],
        },
        children: (
            <svg role="img" aria-label="年別ダイビング本数のサンプルチャート" viewBox="0 0 200 100" className="w-full">
                <rect x="20" y="40" width="40" height="60" className="fill-primary" />
                <rect x="80" y="20" width="40" height="80" className="fill-primary" />
                <rect x="140" y="63" width="40" height="37" className="fill-primary" />
            </svg>
        ),
    },
};
