import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const createRegulator = vi.fn();
const updateRegulator = vi.fn();
const routerPush = vi.fn();
const routerRefresh = vi.fn();

vi.mock('@/features/regulators/server/actions', () => ({
    createRegulator: (...args: unknown[]) => createRegulator(...args),
    updateRegulator: (...args: unknown[]) => updateRegulator(...args),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: routerPush, refresh: routerRefresh }),
}));

import { RegulatorForm } from './RegulatorForm';

describe('RegulatorForm', () => {
    beforeEach(() => {
        createRegulator.mockReset();
        updateRegulator.mockReset();
        routerPush.mockReset();
        routerRefresh.mockReset();
    });

    it('メーカー名・モデル名・日付・OH 周期・メイン機材・メモの入力欄を表示する', () => {
        render(<RegulatorForm />);
        expect(screen.getByLabelText(/メーカー名/)).toBeInTheDocument();
        expect(screen.getByLabelText(/モデル名/)).toBeInTheDocument();
        expect(screen.getByLabelText(/購入日/)).toBeInTheDocument();
        expect(screen.getByLabelText(/前回オーバーホール日/)).toBeInTheDocument();
        expect(screen.getByLabelText(/OH 周期（月）/)).toBeInTheDocument();
        expect(screen.getByLabelText(/OH 周期（本数）/)).toBeInTheDocument();
        expect(screen.getByLabelText('メイン機材にする')).toBeInTheDocument();
        expect(screen.getByLabelText(/メモ/)).toBeInTheDocument();
    });

    it('必須項目が未入力のまま送信するとエラーを表示し、アクションを呼ばない', async () => {
        const user = userEvent.setup();
        render(<RegulatorForm />);

        await user.click(screen.getByRole('button', { name: '登録する' }));

        expect(await screen.findByText('メーカー名を入力してください')).toBeInTheDocument();
        expect(screen.getByText('モデル名を入力してください')).toBeInTheDocument();
        expect(screen.getByText('前回オーバーホール日を入力してください')).toBeInTheDocument();
        expect(createRegulator).not.toHaveBeenCalled();
        expect(updateRegulator).not.toHaveBeenCalled();
    });

    it('新規登録成功時に機材設定ページへ遷移する', async () => {
        createRegulator.mockResolvedValueOnce({ success: true, id: 'new-regulator-id' });
        const user = userEvent.setup();
        render(<RegulatorForm />);

        await user.type(screen.getByLabelText(/メーカー名/), 'SCUBAPRO');
        await user.type(screen.getByLabelText(/モデル名/), 'MK25 EVO / S620Ti');
        await user.type(screen.getByLabelText(/前回オーバーホール日/), '2026-01-15');
        await user.click(screen.getByRole('button', { name: '登録する' }));

        expect(createRegulator).toHaveBeenCalledWith(
            expect.objectContaining({
                brand: 'SCUBAPRO',
                model: 'MK25 EVO / S620Ti',
                lastOverhauledOn: '2026-01-15',
            }),
        );
        expect(routerPush).toHaveBeenCalledWith('/settings/equipment');
        expect(routerRefresh).toHaveBeenCalled();
    });

    it('編集モードでは updateRegulator を呼び、成功時に機材設定ページへ遷移する', async () => {
        updateRegulator.mockResolvedValueOnce({ success: true });
        const user = userEvent.setup();
        render(
            <RegulatorForm
                regulatorId="existing-id"
                defaultValues={{
                    brand: 'TUSA',
                    model: 'RS-1103J',
                    lastOverhauledOn: '2026-02-01',
                    isPrimary: true,
                }}
            />,
        );

        expect(screen.getByRole('button', { name: '更新する' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: '更新する' }));

        expect(updateRegulator).toHaveBeenCalledWith(
            'existing-id',
            expect.objectContaining({ brand: 'TUSA', model: 'RS-1103J', isPrimary: true }),
        );
        expect(routerPush).toHaveBeenCalledWith('/settings/equipment');
        expect(createRegulator).not.toHaveBeenCalled();
    });

    it('createRegulator がエラーを返すと alert を表示する', async () => {
        createRegulator.mockResolvedValueOnce({ success: false, error: '機材の登録に失敗しました' });
        const user = userEvent.setup();
        render(<RegulatorForm />);

        await user.type(screen.getByLabelText(/メーカー名/), 'SCUBAPRO');
        await user.type(screen.getByLabelText(/モデル名/), 'MK25 EVO');
        await user.type(screen.getByLabelText(/前回オーバーホール日/), '2026-01-15');
        await user.click(screen.getByRole('button', { name: '登録する' }));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('機材の登録に失敗しました');
        expect(routerPush).not.toHaveBeenCalled();
    });
});
