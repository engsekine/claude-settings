import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import type { PrimaryRegulatorStatus } from '@/features/dashboard/types';

import { RecordOverhaulButton } from '../../client/RecordOverhaulButton';
import { RegulatorPanel } from './RegulatorPanel';

const baseStatus: PrimaryRegulatorStatus = {
    regulatorId: 'reg-1',
    brand: 'SCUBAPRO',
    model: 'MK25 EVO',
    lastOverhauledOn: '2025-06-01',
    status: {
        nextOverhaulDate: '2026-06-01',
        remainingDays: 120,
        remainingDives: 25,
        level: 'ok',
    },
};

const meta = {
    title: 'features/dashboard/RegulatorPanel',
    component: RegulatorPanel,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof RegulatorPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 余裕あり（青系バッジ） */
export const Ok: Story = { args: { status: baseStatus } };

/** 期限間近（黄系バッジ） */
export const Warning: Story = {
    args: {
        status: {
            ...baseStatus,
            status: { ...baseStatus.status, remainingDays: 14, remainingDives: 5, level: 'warning' },
        },
    },
};

/** 期限切れ（赤系バッジ + role="status"） */
export const Expired: Story = {
    args: {
        status: {
            ...baseStatus,
            status: { ...baseStatus.status, remainingDays: -5, remainingDives: -2, level: 'expired' },
        },
    },
};

/** レギュレーター未登録（登録導線を表示） */
export const Empty: Story = { args: { status: null } };

/** メンテ完了記録ボタン（slot）を組み合わせた表示 */
export const WithRecordButton: Story = {
    args: {
        status: baseStatus,
        recordButton: <RecordOverhaulButton regulatorId="reg-1" onRecord={async () => ({ success: true as const })} />,
    },
};
