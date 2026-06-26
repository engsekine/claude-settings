import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const signUp = vi.fn();

vi.mock('@/features/auth/server/actions', () => ({
    signUp: (...args: unknown[]) => signUp(...args),
    signInWithGoogle: vi.fn(),
}));

import { SignupForm } from './SignupForm';

/**
 * 利用規約に同意する手順（018: モーダル + 末尾スクロールで有効化）。
 * jsdom はレイアウト未計算（scrollHeight=0）のため、モーダルを開いた時点で既読扱いになり、
 * 閉じるとチェックボックスが有効化される。
 */
const agreeToTerms = async (user: ReturnType<typeof userEvent.setup>) => {
    await user.click(screen.getByRole('button', { name: '利用規約を読む' }));
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('checkbox', { name: /利用規約に同意する/ }));
};

describe('SignupForm', () => {
    beforeEach(() => {
        signUp.mockReset();
    });

    it('必要なフォーム項目をすべて表示する', () => {
        render(<SignupForm />);

        const labels = [
            '姓',
            '名',
            '姓（ローマ字）',
            '名（ローマ字）',
            'ニックネーム',
            '生年月日',
            '身長(cm)',
            '体重(kg)',
            'メールアドレス',
            'パスワード（12文字以上・英大文字小文字と数字を含む）',
            'パスワード（確認）',
        ];

        for (const label of labels) {
            expect(screen.getByLabelText(label)).toBeInTheDocument();
        }

        expect(screen.getByRole('group', { name: '性別' })).toBeInTheDocument();
        expect(screen.getByRole('checkbox', { name: /利用規約に同意する/ })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '新規登録' })).toBeInTheDocument();
    });

    it('利用規約に同意しないまま送信すると signUp は呼ばれずエラーが表示される（018）', async () => {
        const user = userEvent.setup();
        render(<SignupForm />);

        await user.type(screen.getByLabelText('姓'), '山田');
        await user.type(screen.getByLabelText('名'), '太郎');
        await user.type(screen.getByLabelText('姓（ローマ字）'), 'Yamada');
        await user.type(screen.getByLabelText('名（ローマ字）'), 'Taro');
        await user.type(screen.getByLabelText('ニックネーム'), 'たろちゃん');
        await user.type(screen.getByLabelText('生年月日'), '1990-01-01');
        await user.type(screen.getByLabelText('メールアドレス'), 'user@example.com');
        await user.type(screen.getByLabelText('パスワード（12文字以上・英大文字小文字と数字を含む）'), 'Password1234');
        await user.type(screen.getByLabelText('パスワード（確認）'), 'Password1234');
        // 利用規約はチェックしないまま送信
        await user.click(screen.getByRole('button', { name: '新規登録' }));

        expect(await screen.findByText('利用規約に同意してください')).toBeInTheDocument();
        expect(signUp).not.toHaveBeenCalled();
    });

    it('signUp が needsEmailConfirmation を返すと確認メール案内画面に切り替わる', async () => {
        signUp.mockResolvedValueOnce({ success: true, needsEmailConfirmation: true });
        const user = userEvent.setup();
        render(<SignupForm />);

        await user.type(screen.getByLabelText('姓'), '山田');
        await user.type(screen.getByLabelText('名'), '太郎');
        await user.type(screen.getByLabelText('姓（ローマ字）'), 'Yamada');
        await user.type(screen.getByLabelText('名（ローマ字）'), 'Taro');
        await user.type(screen.getByLabelText('ニックネーム'), 'たろちゃん');
        await user.type(screen.getByLabelText('生年月日'), '1990-01-01');
        await user.type(screen.getByLabelText('メールアドレス'), 'user@example.com');
        await user.type(screen.getByLabelText('パスワード（12文字以上・英大文字小文字と数字を含む）'), 'Password1234');
        await user.type(screen.getByLabelText('パスワード（確認）'), 'Password1234');
        await agreeToTerms(user);
        await user.click(screen.getByRole('button', { name: '新規登録' }));

        expect(await screen.findByText('確認メールを送信しました')).toBeInTheDocument();
        expect(screen.getByText('user@example.com')).toBeInTheDocument();
    });

    it('身長・体重を入力すると signUp にその値が渡る', async () => {
        signUp.mockResolvedValueOnce({ success: true, needsEmailConfirmation: true });
        const user = userEvent.setup();
        render(<SignupForm />);

        await user.type(screen.getByLabelText('姓'), '山田');
        await user.type(screen.getByLabelText('名'), '太郎');
        await user.type(screen.getByLabelText('姓（ローマ字）'), 'Yamada');
        await user.type(screen.getByLabelText('名（ローマ字）'), 'Taro');
        await user.type(screen.getByLabelText('ニックネーム'), 'taro');
        await user.type(screen.getByLabelText('生年月日'), '1990-01-01');
        await user.type(screen.getByLabelText('身長(cm)'), '170');
        await user.type(screen.getByLabelText('体重(kg)'), '60.5');
        await user.type(screen.getByLabelText('メールアドレス'), 'user@example.com');
        await user.type(screen.getByLabelText('パスワード（12文字以上・英大文字小文字と数字を含む）'), 'Password1234');
        await user.type(screen.getByLabelText('パスワード（確認）'), 'Password1234');
        await agreeToTerms(user);
        await user.click(screen.getByRole('button', { name: '新規登録' }));

        await screen.findByText('確認メールを送信しました');
        expect(signUp).toHaveBeenCalledWith(expect.objectContaining({ heightCm: 170, weightKg: 60.5 }));
    });

    it('signUp が error を返すと alert に表示される', async () => {
        signUp.mockResolvedValueOnce({ success: false, error: 'このメールアドレスは既に登録されています' });
        const user = userEvent.setup();
        render(<SignupForm />);

        await user.type(screen.getByLabelText('姓'), '山田');
        await user.type(screen.getByLabelText('名'), '太郎');
        await user.type(screen.getByLabelText('姓（ローマ字）'), 'Yamada');
        await user.type(screen.getByLabelText('名（ローマ字）'), 'Taro');
        await user.type(screen.getByLabelText('ニックネーム'), 'taro');
        await user.type(screen.getByLabelText('生年月日'), '1990-01-01');
        await user.type(screen.getByLabelText('メールアドレス'), 'existing@example.com');
        await user.type(screen.getByLabelText('パスワード（12文字以上・英大文字小文字と数字を含む）'), 'Password1234');
        await user.type(screen.getByLabelText('パスワード（確認）'), 'Password1234');
        await agreeToTerms(user);
        await user.click(screen.getByRole('button', { name: '新規登録' }));

        expect(await screen.findByText('このメールアドレスは既に登録されています')).toBeInTheDocument();
    });
});
