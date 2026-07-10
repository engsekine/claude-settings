import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { LandingPricing } from './LandingPricing';

const meta = {
    title: 'features/landing/LandingPricing',
    component: LandingPricing,
    tags: ['autodocs'],
    parameters: { layout: 'fullscreen' },
    args: {
        packQuantity: 10,
        packAmountJpy: 300,
        initialGrantAmount: 10,
        dailyBonusAmount: 1,
    },
} satisfies Meta<typeof LandingPricing>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 現行価格（ログパック 10 枠 300 円） */
export const Default: Story = {};
