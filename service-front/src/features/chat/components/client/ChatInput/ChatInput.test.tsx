import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ChatInput } from './ChatInput';

describe('ChatInput', () => {
    const defaultProps = {
        onSend: vi.fn(),
        onStop: vi.fn(),
        streamingStatus: 'idle' as const,
    };

    it('テキスト入力欄と送信ボタンを表示する', () => {
        render(<ChatInput {...defaultProps} />);

        expect(screen.getByRole('textbox', { name: 'チャットメッセージ入力' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'メッセージを送信' })).toBeInTheDocument();
    });

    it('未入力時は送信ボタンが無効化される', () => {
        render(<ChatInput {...defaultProps} />);

        expect(screen.getByRole('button', { name: 'メッセージを送信' })).toBeDisabled();
    });

    it('テキスト入力後に送信ボタンを押すと onSend が呼ばれ、入力がクリアされる', async () => {
        const onSend = vi.fn();
        const user = userEvent.setup();
        render(<ChatInput {...defaultProps} onSend={onSend} />);

        const textbox = screen.getByRole<HTMLTextAreaElement>('textbox', { name: 'チャットメッセージ入力' });
        await user.type(textbox, 'こんにちは');
        await user.click(screen.getByRole('button', { name: 'メッセージを送信' }));

        expect(onSend).toHaveBeenCalledWith('こんにちは');
        expect(textbox.value).toBe('');
    });

    it('Enter キーで送信、Shift+Enter は改行のみ', async () => {
        const onSend = vi.fn();
        const user = userEvent.setup();
        render(<ChatInput {...defaultProps} onSend={onSend} />);

        const textbox = screen.getByRole('textbox', { name: 'チャットメッセージ入力' });
        await user.type(textbox, 'テスト');
        await user.type(textbox, '{Shift>}{Enter}{/Shift}');
        expect(onSend).not.toHaveBeenCalled();

        await user.type(textbox, '{Enter}');
        expect(onSend).toHaveBeenCalledTimes(1);
    });

    it('streaming 中は送信ボタンが停止ボタンに切り替わり onStop が呼べる', async () => {
        const onStop = vi.fn();
        const user = userEvent.setup();
        render(<ChatInput {...defaultProps} streamingStatus="streaming" onStop={onStop} />);

        expect(screen.queryByRole('button', { name: 'メッセージを送信' })).not.toBeInTheDocument();
        const stopButton = screen.getByRole('button', { name: '生成を停止' });
        await user.click(stopButton);

        expect(onStop).toHaveBeenCalled();
    });
});
