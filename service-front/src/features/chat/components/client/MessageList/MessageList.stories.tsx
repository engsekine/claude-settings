import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MessageList } from './MessageList';

const meta = {
    title: 'features/chat/MessageList',
    component: MessageList,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
} satisfies Meta<typeof MessageList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
    args: {
        messages: [],
        streamingStatus: 'idle',
    },
};

export const WithMessages: Story = {
    args: {
        messages: [
            { id: '1', role: 'user', content: 'こんにちは！' },
            { id: '2', role: 'assistant', content: 'こんにちは、何かお手伝いできることはありますか？' },
            { id: '3', role: 'user', content: 'TypeScript について教えてください' },
            { id: '4', role: 'assistant', content: 'TypeScript は JavaScript に**型システム**を追加した言語です。' },
        ],
        streamingStatus: 'idle',
    },
};

export const Streaming: Story = {
    args: {
        messages: [
            { id: '1', role: 'user', content: '長いコードを書いて' },
            { id: '2', role: 'assistant', content: '' },
        ],
        streamingStatus: 'streaming',
    },
};
