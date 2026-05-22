import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Sidebar } from './Sidebar';

const meta = {
    title: 'features/chat/Sidebar',
    component: Sidebar,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    'zustand store (`useChatStore`) に依存。Storybook 上では store の初期状態に依存して描画される。会話履歴を持つ状態で見たい場合は preview で store を初期化するデコレータを追加してください。',
            },
        },
    },
} satisfies Meta<typeof Sidebar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
