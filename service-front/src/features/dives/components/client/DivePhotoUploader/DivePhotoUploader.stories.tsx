import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { DivePhotoUploader } from './DivePhotoUploader';

const meta = {
    title: 'features/dives/DivePhotoUploader',
    component: DivePhotoUploader,
    tags: ['autodocs'],
    args: {
        diveId: '22222222-2222-2222-2222-222222222222',
        userId: '11111111-1111-1111-1111-111111111111',
        existingCount: 0,
    },
} satisfies Meta<typeof DivePhotoUploader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** 既に上限近くまで添付済みのケース */
export const NearLimit: Story = {
    args: { existingCount: 9 },
};
