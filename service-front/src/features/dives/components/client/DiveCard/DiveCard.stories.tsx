import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { DiveListItem } from '@/features/dives/types';
import { DiveCard } from './DiveCard';

const baseDive: DiveListItem = {
    id: 'dive-1',
    diveNumber: 42,
    diveDate: '2026-04-15',
    location: '伊豆 / 大瀬崎',
    maxDepthM: 22.5,
    bottomTimeMin: 48,
    waterTempC: 18.2,
    visibilityM: 12,
    certificationDive: false,
};

const meta = {
    title: 'features/dives/DiveCard',
    component: DiveCard,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof DiveCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { dive: baseDive } };

export const CertificationDive: Story = {
    args: { dive: { ...baseDive, certificationDive: true } },
};

export const Minimal: Story = {
    args: {
        dive: {
            ...baseDive,
            diveNumber: null,
            waterTempC: null,
            visibilityM: null,
        },
    },
};

/** 新月直後の日付（2000-01-07）で「大潮」ラベルが付くケース */
export const SpringTide: Story = {
    args: { dive: { ...baseDive, diveDate: '2000-01-07' } },
};
