import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const requestPasswordReset = vi.fn();

vi.mock('@/features/auth/server/actions', () => ({
    requestPasswordReset: (...args: unknown[]) => requestPasswordReset(...args),
}));

import { ResetPasswordForm } from './ResetPasswordForm';

describe('ResetPasswordForm', () => {
    beforeEach(() => {
        requestPasswordReset.mockReset();
    });

    it('メールアドレス入力欄と送信ボタンを表示する', () => {
        render(<ResetPasswordForm />);

        expect(screen.getByLabelText('メールアドレス')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'リセットリンクを送信' })).toBeInTheDocument();
    });

    it('不正なメール形式ではエラーを表示する', async () => {
        const user = userEvent.setup();
        render(<ResetPasswordForm />);

        await user.type(screen.getByLabelText('メールアドレス'), 'invalid-email');
        await user.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));

        expect(await screen.findByRole('alert')).toBeInTheDocument();
        expect(requestPasswordReset).not.toHaveBeenCalled();
    });

    it('送信成功時は完了メッセージに切り替わる', async () => {
        requestPasswordReset.mockResolvedValueOnce({ success: true });
        const user = userEvent.setup();
        render(<ResetPasswordForm />);

        await user.type(screen.getByLabelText('メールアドレス'), 'user@example.com');
        await user.click(screen.getByRole('button', { name: 'リセットリンクを送信' }));

        expect(await screen.findByRole('status')).toHaveTextContent('リセット用のリンクを送信しました');
        expect(requestPasswordReset).toHaveBeenCalledWith('user@example.com');
    });
});
