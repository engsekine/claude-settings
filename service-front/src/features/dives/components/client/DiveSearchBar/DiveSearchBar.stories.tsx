import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { DiveSearchBar } from './DiveSearchBar';

const meta = {
    title: 'features/dives/DiveSearchBar',
    component: DiveSearchBar,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
    args: { onSubmit: () => {} },
} satisfies Meta<typeof DiveSearchBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInitialFilter: Story = {
    args: {
        initialFilter: { dateFrom: '2026-01-01', dateTo: '2026-12-31', location: '伊豆' },
    },
};
