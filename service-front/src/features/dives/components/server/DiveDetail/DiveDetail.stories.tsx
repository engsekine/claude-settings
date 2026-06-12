import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { Dive } from '@/features/dives/types';

import { DiveDetail } from './DiveDetail';

const baseDive: Dive = {
    id: 'dive-1',
    userId: 'user-1',
    diveNumber: 42,
    diveDate: '2026-04-15',
    entryTime: '09:30:00',
    exitTime: '10:18:00',
    location: '伊豆 / 大瀬崎',
    diveType: 'ファンダイブ',
    weather: '晴れ',
    airTempC: 22,
    waterTempC: 18.2,
    visibilityM: 12,
    wave: '穏やか',
    currentCondition: '弱い',
    maxDepthM: 22.5,
    avgDepthM: 14.8,
    bottomTimeMin: 48,
    tankType: null,
    tankVolumeL: null,
    gasType: null,
    o2Percent: null,
    pressureStartBar: 200,
    pressureEndBar: 60,
    weightKg: 5,
    suitType: 'ウェット 5mm',
    equipmentNotes: null,
    buddyName: null,
    instructorName: null,
    certificationDive: false,
    notes: null,
    isPublic: false,
    publicSlug: null,
    createdAt: '2026-04-15T12:00:00Z',
    updatedAt: '2026-04-15T12:00:00Z',
};

const meta = {
    title: 'features/dives/DiveDetail',
    component: DiveDetail,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof DiveDetail>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { dive: baseDive } };

/** 新月直後の日付（2000-01-07）で「大潮」ラベルが付くケース */
export const SpringTide: Story = {
    args: { dive: { ...baseDive, diveDate: '2000-01-07' } },
};

/** 講習ダイブのバッジ付き */
export const CertificationDive: Story = {
    args: { dive: { ...baseDive, certificationDive: true } },
};
