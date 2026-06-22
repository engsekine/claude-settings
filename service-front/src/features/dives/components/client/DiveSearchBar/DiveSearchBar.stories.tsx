import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { DiveSearchBar } from './DiveSearchBar';

const meta = {
    title: 'features/dives/DiveSearchBar',
    component: DiveSearchBar,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
    args: { onSubmit: fn() },
} satisfies Meta<typeof DiveSearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithBasicFilter: Story = {
    args: {
        initialFilter: { diveNumber: 12, location: '伊豆' },
    },
};

export const WithAdvancedFilter: Story = {
    args: {
        // 詳細フィルタがあると詳細条件パネルが初期展開される
        initialFilter: { dateFrom: '2025-07-01', dateTo: '2025-08-31', depthMin: 18, depthMax: 40, diveType: 'boat' },
    },
};
