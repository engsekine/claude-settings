import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { StatsCards } from './StatsCards';

const meta = {
    title: 'features/dashboard/StatsCards',
    component: StatsCards,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof StatsCards>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 通常（ログあり） */
export const Default: Story = {
    args: {
        stats: {
            totalDives: 42,
            totalBottomTimeMin: 1885,
            maxDepthM: 32.5,
            visitedLocations: 18,
        },
    },
};

/** ログ 0 件（各値 0 表示） */
export const Zero: Story = {
    args: {
        stats: {
            totalDives: 0,
            totalBottomTimeMin: 0,
            maxDepthM: 0,
            visitedLocations: 0,
        },
    },
};

/** 集計失敗（各値「-」+ 失敗メッセージ） */
export const Failed: Story = {
    args: { stats: null },
};
