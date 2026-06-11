import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { RecentDiveItem } from '@/features/dashboard/types';

import { RecentDives } from './RecentDives';

const sampleDives: RecentDiveItem[] = [
    { id: 'dive-1', diveDate: '2026-05-20', location: '石垣島・米原', maxDepthM: 18.5, bottomTimeMin: 42 },
    { id: 'dive-2', diveDate: '2026-05-19', location: '石垣島・崎枝', maxDepthM: 24, bottomTimeMin: 38 },
    { id: 'dive-3', diveDate: '2026-05-18', location: '石垣島・マンタスクランブル', maxDepthM: 16, bottomTimeMin: 45 },
    { id: 'dive-4', diveDate: '2026-04-29', location: '宮古島・下地島', maxDepthM: 28.5, bottomTimeMin: 35 },
    { id: 'dive-5', diveDate: '2026-04-28', location: '宮古島・八重干瀬', maxDepthM: 21, bottomTimeMin: 40 },
];

const meta = {
    title: 'features/dashboard/RecentDives',
    component: RecentDives,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof RecentDives>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 複数件（最大 5 件 + 一覧へのリンク） */
export const Default: Story = {
    args: { dives: sampleDives },
};

/** 0 件（最初のログを記録しよう CTA） */
export const Empty: Story = {
    args: { dives: [] },
};
