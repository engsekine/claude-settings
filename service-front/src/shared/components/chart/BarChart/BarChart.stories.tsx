import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BarChart } from './BarChart';

const meta = {
    title: 'shared/chart/BarChart',
    component: BarChart,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof BarChart>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 通常（年別本数） */
export const Default: Story = {
    args: {
        items: [
            { label: '2024', value: 18 },
            { label: '2025', value: 24 },
            { label: '2026', value: 11 },
        ],
        description: '年別ダイビング本数。2024年 18本、2025年 24本、2026年 11本',
    },
};

/** 0 本の月を含む月別本数（直近 12 ヶ月） */
export const MonthlyWithZeros: Story = {
    args: {
        items: [
            { label: '7月', value: 2 },
            { label: '8月', value: 5 },
            { label: '9月', value: 0 },
            { label: '10月', value: 1 },
            { label: '11月', value: 0 },
            { label: '12月', value: 0 },
            { label: '1月', value: 0 },
            { label: '2月', value: 1 },
            { label: '3月', value: 0 },
            { label: '4月', value: 2 },
            { label: '5月', value: 3 },
            { label: '6月', value: 4 },
        ],
        description: '月別ダイビング本数（直近 12 ヶ月）',
    },
};

/** 単一項目 */
export const SingleItem: Story = {
    args: {
        items: [{ label: '2026', value: 7 }],
        description: '年別ダイビング本数。2026年 7本',
    },
};

/** 多項目（12 年分 — 長期間のログ） */
export const ManyYears: Story = {
    args: {
        items: Array.from({ length: 12 }, (_, index) => ({
            label: `${2015 + index}`,
            value: [3, 8, 12, 6, 15, 20, 4, 0, 9, 18, 24, 11][index],
        })),
        description: '年別ダイビング本数（2015〜2026 年）',
    },
};

/** 全項目 0 本 */
export const AllZero: Story = {
    args: {
        items: [
            { label: '5月', value: 0 },
            { label: '6月', value: 0 },
        ],
        description: '月別ダイビング本数（記録なし）',
    },
};
