import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Breadcrumbs } from './Breadcrumbs';

const meta = {
    title: 'shared/layout/Breadcrumbs',
    component: Breadcrumbs,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleLevel: Story = {
    args: {
        breadcrumbs: [{ name: '会員情報の編集' }],
    },
};

export const TwoLevels: Story = {
    args: {
        breadcrumbs: [{ name: '設定', slug: '/settings' }, { name: '会員情報の編集' }],
    },
};

export const DeepHierarchy: Story = {
    args: {
        breadcrumbs: [
            { name: 'ダイブログ', slug: '/dives' },
            { name: '沖縄', slug: '/dives/okinawa' },
            { name: '青の洞窟', slug: '/dives/okinawa/blue-cave' },
            { name: '2026年5月22日のログ' },
        ],
    },
};
