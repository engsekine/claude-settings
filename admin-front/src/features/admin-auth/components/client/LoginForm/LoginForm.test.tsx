import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { LoginForm } from './LoginForm';

const { signInAdmin } = vi.hoisted(() => ({ signInAdmin: vi.fn() }));

vi.mock('@/features/admin-auth/server/actions', () => ({ signInAdmin }));

describe('LoginForm', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('メールアドレスとパスワードの入力欄とログインボタンを表示する', () => {
        render(<LoginForm />);

        expect(screen.getByLabelText(/メールアドレス/)).toBeInTheDocument();
        expect(screen.getByLabelText(/パスワード/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    });

    it('未入力で送信するとバリデーションエラーを表示し、アクションを呼ばない', async () => {
        render(<LoginForm />);

        fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

        expect(await screen.findByText('メールアドレスを入力してください')).toBeInTheDocument();
        expect(screen.getByText('パスワードを入力してください')).toBeInTheDocument();
        expect(signInAdmin).not.toHaveBeenCalled();
    });

    it('ログイン失敗時はサーバーのエラーメッセージを alert で表示する', async () => {
        signInAdmin.mockResolvedValue({ success: false, error: '管理者権限がありません' });

        render(<LoginForm />);

        fireEvent.change(screen.getByLabelText(/メールアドレス/), { target: { value: 'admin@example.com' } });
        fireEvent.change(screen.getByLabelText(/パスワード/), { target: { value: 'admin-password' } });
        fireEvent.click(screen.getByRole('button', { name: 'ログイン' }));

        await waitFor(() => expect(signInAdmin).toHaveBeenCalledWith('admin@example.com', 'admin-password'));
        expect(await screen.findByRole('alert')).toHaveTextContent('管理者権限がありません');
    });
});
