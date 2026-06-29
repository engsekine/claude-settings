import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { ContactFormValues } from '@/features/contact/schemas/contact.schema';

const submitInquiry = vi.fn();

vi.mock('@/features/contact/server/actions', () => ({
    submitInquiry: (...args: unknown[]) => submitInquiry(...args),
}));

import { ContactForm } from './ContactForm';

const emptyValues: ContactFormValues = { name: '', email: '', category: '', body: '', website: '' };

const filledValues: ContactFormValues = {
    name: '山田太郎',
    email: 'taro@example.com',
    category: 'question',
    body: '質問があります',
    website: '',
};

describe('ContactForm', () => {
    beforeEach(() => {
        submitInquiry.mockReset();
    });

    it('defaultValues がフォーム初期値として反映される', () => {
        render(<ContactForm defaultValues={filledValues} />);

        expect(screen.getByLabelText<HTMLInputElement>(/お名前/).value).toBe('山田太郎');
        expect(screen.getByLabelText<HTMLInputElement>(/メールアドレス/).value).toBe('taro@example.com');
    });

    it('必須項目が空のまま送信するとバリデーションエラーを表示し、送信しない', async () => {
        const user = userEvent.setup();
        render(<ContactForm defaultValues={emptyValues} />);

        await user.click(screen.getByRole('button', { name: '送信する' }));

        expect(await screen.findByText('お名前を入力してください')).toBeInTheDocument();
        expect(screen.getByText('メールアドレスを入力してください')).toBeInTheDocument();
        expect(submitInquiry).not.toHaveBeenCalled();
    });

    it('正しく入力して送信すると受付完了メッセージを表示し、入力をクリアする', async () => {
        submitInquiry.mockResolvedValue({ success: true });
        const user = userEvent.setup();
        render(<ContactForm defaultValues={filledValues} />);

        await user.click(screen.getByRole('button', { name: '送信する' }));

        expect(await screen.findByRole('status')).toHaveTextContent('お問い合わせを受け付けました');
        await waitFor(() => {
            expect(screen.getByLabelText<HTMLInputElement>(/お名前/).value).toBe('');
        });
        expect(submitInquiry).toHaveBeenCalledTimes(1);
    });

    it('送信に失敗するとエラーメッセージ（role=alert）を表示する', async () => {
        submitInquiry.mockResolvedValue({
            success: false,
            error: '送信に失敗しました。時間をおいて再度お試しください',
        });
        const user = userEvent.setup();
        render(<ContactForm defaultValues={filledValues} />);

        await user.click(screen.getByRole('button', { name: '送信する' }));

        expect(await screen.findByRole('alert')).toHaveTextContent('送信に失敗しました');
    });
});
