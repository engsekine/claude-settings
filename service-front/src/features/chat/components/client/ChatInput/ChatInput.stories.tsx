import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import { ChatInput } from './ChatInput';

const meta = {
    title: 'features/chat/ChatInput',
    component: ChatInput,
    tags: ['autodocs'],
    parameters: {
        layout: 'fullscreen',
    },
    args: {
        onSend: fn(),
        onStop: fn(),
    },
} satisfies Meta<typeof ChatInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Idle: Story = {
    args: { streamingStatus: 'idle' },
};

export const Streaming: Story = {
    args: { streamingStatus: 'streaming' },
};

export const ErrorState: Story = {
    args: { streamingStatus: 'error' },
};
