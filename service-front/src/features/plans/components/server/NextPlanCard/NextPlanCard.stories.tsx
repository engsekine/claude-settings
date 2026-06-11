import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { NextPlanSummary } from '@/features/plans/types';

import { NextPlanCardView } from './NextPlanCardView';

const baseSummary: NextPlanSummary = {
    id: 'plan-1',
    plannedOn: '2026-06-20',
    location: '沖縄 / 青の洞窟',
    daysUntil: 9,
    checkedCount: 2,
    totalCount: 5,
};

const meta = {
    title: 'features/plans/NextPlanCard',
    component: NextPlanCardView,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof NextPlanCardView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 予定あり（未来の予定 + 持ち物準備中） */
export const Default: Story = { args: { summary: baseSummary } };

/** 予定なし（計画 CTA を表示） */
export const Empty: Story = { args: { summary: null } };

/** 予定日が今日（バッジが「今日」になる） */
export const Today: Story = {
    args: { summary: { ...baseSummary, daysUntil: 0 } },
};

/** 持ち物が全件チェック済み（「準備完了」表示） */
export const AllPacked: Story = {
    args: { summary: { ...baseSummary, checkedCount: 5, totalCount: 5 } },
};
