import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import type { Message } from '../../../types';
import { MessageList } from './MessageList';

vi.mock('../../../hooks/use-auto-scroll', () => ({
    useAutoScroll: () => ({ containerRef: { current: null } }),
}));

const buildMessages = (count: number): Message[] =>
    Array.from({ length: count }, (_, i) => ({
        id: `msg-${i + 1}`,
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `メッセージ ${i + 1}`,
        createdAt: 0,
    }));

describe('MessageList', () => {
    it('メッセージが空のときは空状態のメッセージを表示する', () => {
        render(<MessageList messages={[]} streamingStatus="idle" />);

        expect(screen.getByText('メッセージはまだありません')).toBeInTheDocument();
        expect(screen.getByText('下の入力欄からメッセージを送信してください')).toBeInTheDocument();
    });

    it('メッセージがあるときはバブルとして描画する', () => {
        const messages = buildMessages(3);
        render(<MessageList messages={messages} streamingStatus="idle" />);

        expect(screen.getByText('メッセージ 1')).toBeInTheDocument();
        expect(screen.getByText('メッセージ 2')).toBeInTheDocument();
        expect(screen.getByText('メッセージ 3')).toBeInTheDocument();
    });
});
