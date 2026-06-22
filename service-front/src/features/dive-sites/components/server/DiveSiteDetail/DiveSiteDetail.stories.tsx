import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { DiveSiteDetail } from './DiveSiteDetail';

const meta = {
    title: 'features/dive-sites/DiveSiteDetail',
    component: DiveSiteDetail,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof DiveSiteDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

const site = {
    id: 'site-1',
    name: '大瀬崎',
    area: '伊豆',
    country: 'JP',
    description: '初心者から上級者まで楽しめる定番ポイント',
};

/** 実績あり（本数・平均透明度・ベストシーズン） */
export const Default: Story = {
    args: { site, stats: { diveCount: 8, avgVisibilityM: 14.2, bestSeasonMonths: [7, 8, 9] } },
};

/** ログ 0 件 */
export const Empty: Story = {
    args: { site, stats: { diveCount: 0, avgVisibilityM: null, bestSeasonMonths: [] } },
};

/** ログはあるがベストシーズンを出すには不足 */
export const FewDives: Story = {
    args: { site, stats: { diveCount: 2, avgVisibilityM: 10, bestSeasonMonths: [] } },
};
