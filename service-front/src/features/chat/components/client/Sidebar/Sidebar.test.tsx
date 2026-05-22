import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { Sidebar } from './Sidebar';

const mockState = {
    conversations: [] as Array<{ id: string; title: string }>,
    activeConversationId: null as string | null,
    createConversation: vi.fn(),
    setActiveConversation: vi.fn(),
    deleteConversation: vi.fn(),
};

vi.mock('../../../stores/chat-store', () => ({
    useChatStore: <T,>(selector: (state: typeof mockState) => T): T => selector(mockState),
}));

describe('Sidebar', () => {
    beforeEach(() => {
        mockState.conversations = [];
        mockState.activeConversationId = null;
        mockState.createConversation.mockClear();
        mockState.setActiveConversation.mockClear();
        mockState.deleteConversation.mockClear();
    });

    it('会話が無いときは「まだ会話がありません」と表示する', () => {
        render(<Sidebar />);

        expect(screen.getByText('まだ会話がありません')).toBeInTheDocument();
    });

    it('会話リストを表示し、選択中の会話を aria-current="true" にする', () => {
        mockState.conversations = [
            { id: 'c1', title: '会話 A' },
            { id: 'c2', title: '会話 B' },
        ];
        mockState.activeConversationId = 'c2';

        render(<Sidebar />);

        const conversationA = screen.getByRole('button', { name: '会話 A' });
        const conversationB = screen.getByRole('button', { name: '会話 B' });
        expect(conversationA).not.toHaveAttribute('aria-current');
        expect(conversationB).toHaveAttribute('aria-current', 'true');
    });

    it('新しいチャットボタンで createConversation が呼ばれる', async () => {
        const user = userEvent.setup();
        render(<Sidebar />);

        await user.click(screen.getByRole('button', { name: '新しいチャットを作成' }));
        expect(mockState.createConversation).toHaveBeenCalled();
    });

    it('閉じるボタンを押すとサイドバーが折りたたまれ、開くボタンが表示される', async () => {
        const user = userEvent.setup();
        render(<Sidebar />);

        await user.click(screen.getByRole('button', { name: 'サイドバーを閉じる' }));
        expect(screen.getByRole('button', { name: 'サイドバーを開く' })).toBeInTheDocument();
    });
});
