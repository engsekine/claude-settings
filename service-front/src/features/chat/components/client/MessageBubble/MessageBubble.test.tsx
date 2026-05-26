import { render, screen } from '@testing-library/react';
import type { Message } from '../../../types';
import { MessageBubble } from './MessageBubble';

const buildMessage = (overrides: Partial<Message> = {}): Message => ({
    id: 'msg-1',
    role: 'user',
    content: 'テストメッセージ',
    createdAt: 0,
    ...overrides,
});

describe('MessageBubble', () => {
    it('ユーザー発言を whitespace 維持で描画する', () => {
        render(<MessageBubble message={buildMessage({ role: 'user', content: '改行を\n保持する' })} />);

        const paragraph = screen.getByText('改行を 保持する');
        expect(paragraph).toHaveClass('whitespace-pre-wrap');
    });

    it('アシスタント発言は Markdown としてレンダリングする', () => {
        render(
            <MessageBubble
                message={buildMessage({
                    id: 'msg-2',
                    role: 'assistant',
                    content: '**強調** されたテキスト',
                })}
            />,
        );

        expect(screen.getByText('強調').tagName.toLowerCase()).toBe('strong');
    });

    it('アシスタント発言で content が空かつ isStreaming のときはパルスインジケータを描画する', () => {
        const { container } = render(
            <MessageBubble message={buildMessage({ role: 'assistant', content: '' })} isStreaming />,
        );

        const pulse = container.querySelector('.animate-pulse');
        expect(pulse).not.toBeNull();
    });

    it('アシスタント発言で content が空かつ isStreaming でないときは何も描画しない', () => {
        const { container } = render(
            <MessageBubble message={buildMessage({ role: 'assistant', content: '' })} isStreaming={false} />,
        );

        expect(container.querySelector('.animate-pulse')).toBeNull();
    });
});
