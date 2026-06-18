import type { Meta, StoryObj } from '@storybook/nextjs-vite';

import { ExportMenu } from './ExportMenu';

const meta = {
    title: 'features/dives/ExportMenu',
    component: ExportMenu,
    tags: ['autodocs'],
    parameters: { layout: 'padded' },
} satisfies Meta<typeof ExportMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

/** 一覧用: 現在の絞り込み条件を引き継いでエクスポート */
export const Default: Story = {
    args: {},
};

/** 複数選択した分のみをエクスポート */
export const WithSelection: Story = {
    args: { selectedIds: ['00000000-0000-4000-8000-000000000001'] },
};

/** 0 件選択など、操作不可 */
export const Disabled: Story = {
    args: { disabled: true },
};
