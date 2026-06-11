import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PlanList } from './PlanList';

const meta = {
    title: 'features/plans/PlanList',
    component: PlanList,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof PlanList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
    args: { plans: [], today: '2026-06-10' },
};

export const WithPlans: Story = {
    args: {
        today: '2026-06-10',
        plans: [
            {
                id: 'p1',
                plannedOn: '2026-06-10',
                location: '沖縄 / 青の洞窟',
                notes: null,
                createdAt: '2026-06-01T00:00:00Z',
                updatedAt: '2026-06-01T00:00:00Z',
            },
            {
                id: 'p2',
                plannedOn: '2026-06-20',
                location: '伊豆 / 大瀬崎',
                notes: 'ナイトダイブ予定',
                createdAt: '2026-06-01T00:00:00Z',
                updatedAt: '2026-06-01T00:00:00Z',
            },
            {
                id: 'p3',
                plannedOn: '2026-05-30',
                location: '伊豆 / IOP',
                notes: null,
                createdAt: '2026-05-01T00:00:00Z',
                updatedAt: '2026-05-01T00:00:00Z',
            },
        ],
    },
};
