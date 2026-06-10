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

export const WithInitialFilter: Story = {
    args: {
        initialFilter: { diveNumber: 12, diveDate: '2026-01-01', location: '伊豆' },
    },
};
