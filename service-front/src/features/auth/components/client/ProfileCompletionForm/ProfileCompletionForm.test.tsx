import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const completeProfile = vi.fn();

vi.mock('@/features/auth/server/actions', () => ({
    completeProfile: (...args: unknown[]) => completeProfile(...args),
}));

import { ProfileCompletionForm } from './ProfileCompletionForm';

describe('ProfileCompletionForm', () => {
    beforeEach(() => {
        completeProfile.mockReset();
    });

    it('全プロフィール項目（姓名・ローマ字・ニックネーム・生年月日・性別）を表示する', () => {
        render(<ProfileCompletionForm />);

        expect(screen.getByLabelText('姓')).toBeInTheDocument();
        expect(screen.getByLabelText('名')).toBeInTheDocument();
        expect(screen.getByLabelText('姓（ローマ字）')).toBeInTheDocument();
        expect(screen.getByLabelText('名（ローマ字）')).toBeInTheDocument();
        expect(screen.getByLabelText('ニックネーム')).toBeInTheDocument();
        expect(screen.getByLabelText('生年月日')).toBeInTheDocument();
        expect(screen.getByRole('group', { name: '性別' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '登録して始める' })).toBeInTheDocument();
    });

    it('必須未入力で送信するとバリデーションエラーが表示され completeProfile は呼ばれない', async () => {
        const user = userEvent.setup();
        render(<ProfileCompletionForm />);

        await user.click(screen.getByRole('button', { name: '登録して始める' }));

        const alerts = await screen.findAllByRole('alert');
        expect(alerts.length).toBeGreaterThan(0);
        expect(completeProfile).not.toHaveBeenCalled();
    });

    it('completeProfile がエラーを返すと root エラーが表示される', async () => {
        completeProfile.mockResolvedValueOnce({ success: false, error: 'プロフィールの保存に失敗しました' });
        const user = userEvent.setup();
        render(<ProfileCompletionForm />);

        await user.type(screen.getByLabelText('姓'), '山田');
        await user.type(screen.getByLabelText('名'), '太郎');
        await user.type(screen.getByLabelText('姓（ローマ字）'), 'Yamada');
        await user.type(screen.getByLabelText('名（ローマ字）'), 'Taro');
        await user.type(screen.getByLabelText('ニックネーム'), 'たろちゃん');
        await user.type(screen.getByLabelText('生年月日'), '1990-01-01');
        await user.click(screen.getByRole('button', { name: '登録して始める' }));

        expect(await screen.findByText('プロフィールの保存に失敗しました')).toBeInTheDocument();
        expect(completeProfile).toHaveBeenCalledTimes(1);
    });
});
