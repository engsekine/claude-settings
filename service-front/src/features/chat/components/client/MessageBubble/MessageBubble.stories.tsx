import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { MessageBubble } from './MessageBubble';

const meta = {
    title: 'features/chat/MessageBubble',
    component: MessageBubble,
    tags: ['autodocs'],
    parameters: {
        layout: 'padded',
    },
} satisfies Meta<typeof MessageBubble>;

export default meta;
type Story = StoryObj<typeof meta>;

export const UserMessage: Story = {
    args: {
        message: {
            id: 'user-1',
            role: 'user',
            content: 'こんにちは!\n質問があります。',
        },
    },
};

export const AssistantMessage: Story = {
    args: {
        message: {
            id: 'assistant-1',
            role: 'assistant',
            content: 'もちろん、お手伝いします。\n\n**何でも**お聞きください。',
        },
    },
};

export const AssistantStreaming: Story = {
    args: {
        message: {
            id: 'assistant-streaming',
            role: 'assistant',
            content: '',
        },
        isStreaming: true,
    },
};

export const AssistantWithCodeBlock: Story = {
    args: {
        message: {
            id: 'assistant-code',
            role: 'assistant',
            content: [
                '以下のコードを試してください:',
                '',
                '```ts',
                // biome-ignore lint/suspicious/noTemplateCurlyInString: Markdown コードブロックの内容として TS のテンプレートリテラル例を表示するため
                'const greet = (name: string) => `Hello, ${name}`;',
                '```',
            ].join('\n'),
        },
    },
};
