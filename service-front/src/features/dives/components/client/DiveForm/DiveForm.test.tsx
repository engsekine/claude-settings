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

    it('必須項目（潜水日・ポイント名・最大水深・潜水時間）を表示する', () => {
        render(<DiveForm />);
        expect(screen.getByLabelText(/潜水日/)).toBeInTheDocument();
        expect(screen.getByLabelText(/ポイント名/)).toBeInTheDocument();
        expect(screen.getByLabelText(/最大水深\(m\)/)).toBeInTheDocument();
        expect(screen.getByLabelText(/潜水時間\(分\)/)).toBeInTheDocument();
    });

    it('新規作成成功時に詳細ページへ遷移する', async () => {
        createDive.mockResolvedValueOnce({ success: true, id: 'new-id' });
        const user = userEvent.setup();
        render(<DiveForm />);

        await user.clear(screen.getByLabelText(/ポイント名/));
        await user.type(screen.getByLabelText(/ポイント名/), '伊豆');
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

    it('エントリー / エキジット時刻を入力すると潜水時間が自動計算される', async () => {
        const user = userEvent.setup();
        render(<DiveForm />);

        const entry = screen.getByLabelText('エントリー時刻') as HTMLInputElement;
        const exit = screen.getByLabelText('エキジット時刻') as HTMLInputElement;
        const bottomTime = screen.getByLabelText(/潜水時間\(分\)/) as HTMLInputElement;

        await user.type(entry, '09:00');
        await user.type(exit, '09:45');

        expect(bottomTime.value).toBe('45');
        expect(screen.getByText('エントリー / エキジット時刻から自動計算します')).toBeInTheDocument();
    });

    it('潜水時間を手動編集すると以降は自動計算しない', async () => {
        const user = userEvent.setup();
        render(<DiveForm />);

        const entry = screen.getByLabelText('エントリー時刻') as HTMLInputElement;
        const exit = screen.getByLabelText('エキジット時刻') as HTMLInputElement;
        const bottomTime = screen.getByLabelText(/潜水時間\(分\)/) as HTMLInputElement;

        await user.type(entry, '09:00');
        await user.type(exit, '09:45');
        expect(bottomTime.value).toBe('45');

        await user.clear(bottomTime);
        await user.type(bottomTime, '60');
        expect(bottomTime.value).toBe('60');

        await user.clear(exit);
        await user.type(exit, '10:30');
        expect(bottomTime.value).toBe('60');
        expect(screen.queryByText('エントリー / エキジット時刻から自動計算します')).not.toBeInTheDocument();
    });

    it('編集モード（既存値あり）では自動計算しない', async () => {
        const user = userEvent.setup();
        render(<DiveForm diveId="existing-id" defaultValues={{ bottomTimeMin: 50 }} />);

        const bottomTime = screen.getByLabelText(/潜水時間\(分\)/) as HTMLInputElement;
        expect(bottomTime.value).toBe('50');
        expect(screen.queryByText('エントリー / エキジット時刻から自動計算します')).not.toBeInTheDocument();

        await user.type(screen.getByLabelText('エントリー時刻'), '09:00');
        await user.type(screen.getByLabelText('エキジット時刻'), '09:45');
        expect(bottomTime.value).toBe('50');
    });

    it('createDive がエラーを返すと alert を表示する', async () => {
        createDive.mockResolvedValueOnce({ success: false, error: '失敗しました' });
        const user = userEvent.setup();
        render(<DiveForm />);

        await user.clear(screen.getByLabelText(/ポイント名/));
        await user.type(screen.getByLabelText(/ポイント名/), '伊豆');
        await user.clear(screen.getByLabelText(/最大水深\(m\)/));
        await user.type(screen.getByLabelText(/最大水深\(m\)/), '18');
        await user.clear(screen.getByLabelText(/潜水時間\(分\)/));
        await user.type(screen.getByLabelText(/潜水時間\(分\)/), '45');

        await user.click(screen.getByRole('button', { name: '作成する' }));

        expect(await screen.findByText('失敗しました')).toBeInTheDocument();
    });

    it('編集モードでは既存写真に ✕ を表示し、押すと削除予定にマークする', async () => {
        const user = userEvent.setup();
        render(
            <DiveForm
                diveId="d1"
                existingPhotos={[
                    {
                        id: 'p1',
                        displayUrl: '/display-p1.webp',
                        thumbUrl: '/thumb-p1.webp',
                        caption: '',
                        isCover: true,
                        width: 800,
                        height: 600,
                        alt: '海の写真',
                    },
                ]}
            />,
        );

        await user.click(screen.getByRole('button', { name: '海の写真 を削除' }));

        const toggled = screen.getByRole('button', { name: '海の写真 の削除を取り消す' });
        expect(toggled).toHaveAttribute('aria-pressed', 'true');
        expect(screen.getByText('削除予定')).toBeInTheDocument();
    });
});
