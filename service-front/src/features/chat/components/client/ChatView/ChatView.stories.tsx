import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ChatView } from './ChatView';

const meta = {
    title: 'features/chat/ChatView',
    component: ChatView,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
        docs: {
            description: {
                component:
                    '`useChat` フックと `useChatStore` に依存するコンテナコンポーネント。Storybook 上では store / fetch のモックが必要なため、デコレータの追加を推奨。',
            },
        },
    },
} satisfies Meta<typeof ChatView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
