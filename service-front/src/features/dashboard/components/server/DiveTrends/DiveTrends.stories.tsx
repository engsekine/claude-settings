import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { MonthlyDiveStat } from '@/features/dashboard/types';

import { DiveTrends } from './DiveTrends';

const months = [
    '2025-07',
    '2025-08',
    '2025-09',
    '2025-10',
    '2025-11',
    '2025-12',
    '2026-01',
    '2026-02',
    '2026-03',
    '2026-04',
    '2026-05',
    '2026-06',
];

const emptyMonthly: MonthlyDiveStat[] = months.map((month) => ({
    month,
    diveCount: 0,
    avgWaterTempC: null,
    maxDepthM: null,
}));

const sampleMonthly: MonthlyDiveStat[] = months.map((month, index) => ({
    month,
    diveCount: [2, 5, 3, 1, 0, 0, 0, 2, 1, 3, 4, 6][index],
    avgWaterTempC: [27.5, 28.0, 26.0, 23.5, null, null, null, 16.0, 17.5, 19.0, 21.0, 23.0][index],
    maxDepthM: [18.0, 24.0, 22.5, 15.0, null, null, null, 30.5, 25.0, 20.0, 26.5, 28.0][index],
}));

const meta = {
    title: 'features/dashboard/DiveTrends',
    component: DiveTrends,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof DiveTrends>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 通常（複数年・複数月のログあり） */
export const Default: Story = {
    args: {
        yearlyCounts: [
            { year: 2024, diveCount: 18 },
            { year: 2025, diveCount: 24 },
            { year: 2026, diveCount: 11 },
        ],
        monthlyStats: sampleMonthly,
    },
};

/** ログはあるが直近 12 ヶ月は 0 本（research.md R-006: 空状態にしない） */
export const NoRecentDives: Story = {
    args: {
        yearlyCounts: [{ year: 2023, diveCount: 9 }],
        monthlyStats: emptyMonthly,
    },
};

/** 水温の記録が全期間 0 件（水温カードのみ空状態 — US3-AC3） */
export const WaterTempEmpty: Story = {
    args: {
        yearlyCounts: [{ year: 2026, diveCount: 5 }],
        monthlyStats: months.map((month, index) => ({
            month,
            diveCount: [0, 1, 0, 0, 0, 0, 0, 1, 0, 1, 1, 1][index],
            avgWaterTempC: null,
            maxDepthM: [null, 24.0, null, null, null, null, null, 30.5, null, 20.0, 26.5, 28.0][index],
        })),
    },
};

/** ログ 0 件（空状態 + 記録 CTA — FR-007） */
export const Empty: Story = {
    args: {
        yearlyCounts: [],
        monthlyStats: emptyMonthly,
    },
};

/** 集計失敗 */
export const Failed: Story = {
    args: {
        yearlyCounts: null,
        monthlyStats: null,
    },
};
