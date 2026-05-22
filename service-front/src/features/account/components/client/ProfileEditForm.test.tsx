import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import type { ProfileFormValues } from '@/features/account/schemas/profile.schema';

const updateProfile = vi.fn();

vi.mock('@/features/account/server/actions', () => ({
    updateProfile: (...args: unknown[]) => updateProfile(...args),
}));

import { ProfileEditForm } from './ProfileEditForm';

const defaultValues: ProfileFormValues = {
    lastName: '山田',
    firstName: '太郎',
    lastNameRomaji: 'Yamada',
    firstNameRomaji: 'Taro',
    nickname: 'たろちゃん',
    birthOn: '1990-01-01',
    gender: 'male',
};

describe('ProfileEditForm', () => {
    beforeEach(() => {
        updateProfile.mockReset();
    });

    it('メールアドレスを readonly として表示する', () => {
        render(<ProfileEditForm email="user@example.com" defaultValues={defaultValues} />);

        const emailInput = screen.getByLabelText<HTMLInputElement>('メールアドレス');
        expect(emailInput.value).toBe('user@example.com');
        expect(emailInput).toHaveAttribute('readonly');
    });

    it('defaultValues がフォーム初期値として反映される', () => {
        render(<ProfileEditForm email="user@example.com" defaultValues={defaultValues} />);

        expect(screen.getByLabelText<HTMLInputElement>('姓').value).toBe('山田');
        expect(screen.getByLabelText<HTMLInputElement>('名').value).toBe('太郎');
        expect(screen.getByLabelText<HTMLInputElement>('ニックネーム').value).toBe('たろちゃん');
    });

    it('初期状態（未編集）では更新ボタンが無効化される', () => {
        render(<ProfileEditForm email="user@example.com" defaultValues={defaultValues} />);

        expect(screen.getByRole('button', { name: '更新する' })).toBeDisabled();
    });

    it('updateProfile が成功すると status メッセージを表示する', async () => {
        updateProfile.mockResolvedValueOnce({ error: undefined });
        const user = userEvent.setup();
        render(<ProfileEditForm email="user@example.com" defaultValues={defaultValues} />);

        await user.clear(screen.getByLabelText('ニックネーム'));
        await user.type(screen.getByLabelText('ニックネーム'), 'newnick');
        await user.click(screen.getByRole('button', { name: '更新する' }));

        expect(await screen.findByRole('status')).toHaveTextContent('プロフィールを更新しました');
        expect(updateProfile).toHaveBeenCalled();
    });

    it('updateProfile がエラーを返すと alert に表示される', async () => {
        updateProfile.mockResolvedValueOnce({ error: '更新に失敗しました' });
        const user = userEvent.setup();
        render(<ProfileEditForm email="user@example.com" defaultValues={defaultValues} />);

        await user.clear(screen.getByLabelText('ニックネーム'));
        await user.type(screen.getByLabelText('ニックネーム'), 'newnick');
        await user.click(screen.getByRole('button', { name: '更新する' }));

        expect(await screen.findByText('更新に失敗しました')).toBeInTheDocument();
    });
});
