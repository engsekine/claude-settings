import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const createDive = vi.fn();
const updateDive = vi.fn();
const routerPush = vi.fn();
const routerRefresh = vi.fn();
const routerBack = vi.fn();

vi.mock('@/features/dives/server/actions', () => ({
    createDive: (...args: unknown[]) => createDive(...args),
    updateDive: (...args: unknown[]) => updateDive(...args),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: routerPush, refresh: routerRefresh, back: routerBack }),
}));

import { DiveForm } from './DiveForm';

describe('DiveForm', () => {
    beforeEach(() => {
        createDive.mockReset();
        updateDive.mockReset();
        routerPush.mockReset();
        routerRefresh.mockReset();
    });

    it('必須項目（潜水日・エリア / ポイント名・最大水深・潜水時間）を表示する', () => {
        render(<DiveForm />);
        expect(screen.getByLabelText(/潜水日/)).toBeInTheDocument();
        expect(screen.getByLabelText(/エリア \/ ポイント名/)).toBeInTheDocument();
        expect(screen.getByLabelText(/最大水深\(m\)/)).toBeInTheDocument();
        expect(screen.getByLabelText(/潜水時間\(分\)/)).toBeInTheDocument();
    });

    it('新規作成成功時に詳細ページへ遷移する', async () => {
        createDive.mockResolvedValueOnce({ id: 'new-id' });
        const user = userEvent.setup();
        render(<DiveForm />);

        await user.clear(screen.getByLabelText(/エリア \/ ポイント名/));
        await user.type(screen.getByLabelText(/エリア \/ ポイント名/), '伊豆');
        await user.clear(screen.getByLabelText(/最大水深\(m\)/));
        await user.type(screen.getByLabelText(/最大水深\(m\)/), '18');
        await user.clear(screen.getByLabelText(/潜水時間\(分\)/));
        await user.type(screen.getByLabelText(/潜水時間\(分\)/), '45');

        await user.click(screen.getByRole('button', { name: '作成する' }));

        expect(createDive).toHaveBeenCalled();
        expect(routerPush).toHaveBeenCalledWith('/dives/new-id');
    });

    it('編集モードでは「更新する」ボタンを表示する', () => {
        render(<DiveForm diveId="existing-id" />);
        expect(screen.getByRole('button', { name: '更新する' })).toBeInTheDocument();
    });

    it('createDive がエラーを返すと alert を表示する', async () => {
        createDive.mockResolvedValueOnce({ error: '失敗しました' });
        const user = userEvent.setup();
        render(<DiveForm />);

        await user.clear(screen.getByLabelText(/エリア \/ ポイント名/));
        await user.type(screen.getByLabelText(/エリア \/ ポイント名/), '伊豆');
        await user.clear(screen.getByLabelText(/最大水深\(m\)/));
        await user.type(screen.getByLabelText(/最大水深\(m\)/), '18');
        await user.clear(screen.getByLabelText(/潜水時間\(分\)/));
        await user.type(screen.getByLabelText(/潜水時間\(分\)/), '45');

        await user.click(screen.getByRole('button', { name: '作成する' }));

        expect(await screen.findByText('失敗しました')).toBeInTheDocument();
    });
});
