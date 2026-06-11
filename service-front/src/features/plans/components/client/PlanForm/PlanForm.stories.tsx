import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PlanForm } from './PlanForm';

const meta = {
    title: 'features/plans/PlanForm',
    component: PlanForm,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
        nextjs: {
            appDirectory: true,
            navigation: { pathname: '/plans/new' },
        },
    },
} satisfies Meta<typeof PlanForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NewMode: Story = {};

export const EditMode: Story = {
    args: {
        planId: 'sample-id',
        defaultValues: {
            plannedOn: '2026-07-20',
            location: '伊豆 / 大瀬崎',
            notes: '到着 8:30。ナイトロックス予約済み。',
        },
    },
};
