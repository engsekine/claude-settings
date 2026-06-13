import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { BlankDays } from './BlankDays';

const meta = {
    title: 'features/dashboard/BlankDays',
    component: BlankDays,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof BlankDays>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 通常（最後に潜ってから 45 日が経過） */
export const Default: Story = {
    args: { blankDays: 45 },
};

/** 0 日（今日潜った。「今日もダイビング日和！」文言が表示される） */
export const Today: Story = {
    args: { blankDays: 0 },
};
