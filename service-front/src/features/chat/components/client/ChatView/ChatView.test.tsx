import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { Message, StreamingStatus } from '../../../types';

const useChatMock = vi.fn();
const setStreamingStatus = vi.fn();
const mockChatStoreState = {
    setStreamingStatus,
    conversations: [],
    activeConversationId: null,
    createConversation: vi.fn(),
    setActiveConversation: vi.fn(),
    deleteConversation: vi.fn(),
};

vi.mock('../../../hooks/use-chat', () => ({
    useChat: () => useChatMock(),
}));

vi.mock('../../../hooks/use-auto-scroll', () => ({
    useAutoScroll: () => ({ containerRef: { current: null } }),
}));

vi.mock('../../../stores/chat-store', () => ({
    useChatStore: <T,>(selector: (state: typeof mockChatStoreState) => T): T => selector(mockChatStoreState),
}));

const buildChatState = (overrides: Partial<{
    messages: Message[];
    streamingStatus: StreamingStatus;
    sendMessage: ReturnType<typeof vi.fn>;
    stopStreaming: ReturnType<typeof vi.fn>;
}> = {}) => ({
    messages: [],
    streamingStatus: 'idle' as StreamingStatus,
    sendMessage: vi.fn(),
    stopStreaming: vi.fn(),
    ...overrides,
});

import { ChatView } from './ChatView';

describe('ChatView', () => {
    beforeEach(() => {
        useChatMock.mockReset();
        setStreamingStatus.mockClear();
    });

    it('MessageList と ChatInput を描画する', () => {
        useChatMock.mockReturnValue(buildChatState());

        render(<ChatView />);

        expect(screen.getByText('メッセージはまだありません')).toBeInTheDocument();
        expect(screen.getByRole('textbox', { name: 'チャットメッセージ入力' })).toBeInTheDocument();
    });

    it('streamingStatus が "error" のときはエラー通知を表示する', () => {
        useChatMock.mockReturnValue(buildChatState({ streamingStatus: 'error' }));

        render(<ChatView />);

        expect(screen.getByRole('alert')).toHaveTextContent('メッセージの生成中にエラーが発生しました');
    });

    it('エラー通知の「閉じる」を押すと setStreamingStatus が "idle" で呼ばれる', async () => {
        useChatMock.mockReturnValue(buildChatState({ streamingStatus: 'error' }));
        const user = userEvent.setup();

        render(<ChatView />);

        await user.click(screen.getByRole('button', { name: '閉じる' }));
        expect(setStreamingStatus).toHaveBeenCalledWith('idle');
    });
});
