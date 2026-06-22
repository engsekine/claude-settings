import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const createCertification = vi.fn();
const updateCertification = vi.fn();
const routerPush = vi.fn();
const routerRefresh = vi.fn();

vi.mock('@/features/certifications/server/actions', () => ({
    createCertification: (...args: unknown[]) => createCertification(...args),
    updateCertification: (...args: unknown[]) => updateCertification(...args),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ push: routerPush, refresh: routerRefresh }),
}));

// todayInJst を固定して「未来日付」テストを安定させる
vi.mock('@/shared/lib/date', () => ({
    todayInJst: () => '2026-06-12',
}));

import { CertificationForm } from './CertificationForm';

describe('CertificationForm', () => {
    beforeEach(() => {
        createCertification.mockReset();
        updateCertification.mockReset();
        routerPush.mockReset();
        routerRefresh.mockReset();
    });

    it('新規モードで指導団体・資格ランク・取得日の入力欄を表示する', () => {
        render(<CertificationForm />);
        expect(screen.getByLabelText(/指導団体/)).toBeInTheDocument();
        expect(screen.getByLabelText(/資格ランク/)).toBeInTheDocument();
        expect(screen.getByLabelText(/取得日/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: '登録する' })).toBeInTheDocument();
    });

    it('任意項目（ダイバーNo. / インストラクターNo. / 指導者・ショップ / 取得場所 / タグ / 取得ダイブ）の入力欄を表示する', () => {
        render(<CertificationForm />);
        expect(screen.getByLabelText(/ダイバーナンバー/)).toBeInTheDocument();
        expect(screen.getByLabelText(/インストラクターナンバー/)).toBeInTheDocument();
        expect(screen.getByLabelText(/指導者・ショップ名/)).toBeInTheDocument();
        expect(screen.getByLabelText(/取得場所/)).toBeInTheDocument();
        expect(screen.getByLabelText(/スペシャリティタグ/)).toBeInTheDocument();
        expect(screen.getByLabelText(/取得ダイブ/)).toBeInTheDocument();
    });

    it('取得ダイブを選択して送信すると diveId が createCertification に渡る', async () => {
        createCertification.mockResolvedValueOnce({ success: true, id: 'new-cert-id' });
        const user = userEvent.setup();
        render(<CertificationForm diveOptions={[{ value: 'dive-1', label: '2024/05/20 石垣島・米原' }]} />);

        await user.selectOptions(screen.getByLabelText(/指導団体/), 'padi');
        await user.type(screen.getByLabelText(/資格ランク/), 'Open Water Diver');
        await user.type(screen.getByLabelText(/取得日/), '2024-05-20');
        await user.selectOptions(screen.getByLabelText(/取得ダイブ/), 'dive-1');
        await user.click(screen.getByRole('button', { name: '登録する' }));

        expect(createCertification).toHaveBeenCalledWith(expect.objectContaining({ diveId: 'dive-1' }));
    });

    it('任意項目とタグを入力して送信すると値が createCertification に渡る', async () => {
        createCertification.mockResolvedValueOnce({ success: true, id: 'new-cert-id' });
        const user = userEvent.setup();
        render(<CertificationForm />);

        await user.selectOptions(screen.getByLabelText(/指導団体/), 'padi');
        await user.type(screen.getByLabelText(/資格ランク/), 'Rescue Diver');
        await user.type(screen.getByLabelText(/取得日/), '2024-03-15');
        await user.type(screen.getByLabelText(/ダイバーナンバー/), '1234567890');
        await user.type(screen.getByLabelText(/インストラクターナンバー/), 'I-98765');
        await user.type(screen.getByLabelText(/指導者・ショップ名/), '石垣島ダイビングショップ');
        await user.type(screen.getByLabelText(/取得場所/), '沖縄県石垣市');
        await user.type(screen.getByLabelText(/スペシャリティタグ/), 'エンリッチド・エア, ディープ');
        await user.click(screen.getByRole('button', { name: '登録する' }));

        expect(createCertification).toHaveBeenCalledWith(
            expect.objectContaining({
                diverNumber: '1234567890',
                instructorNumber: 'I-98765',
                trainedBy: '石垣島ダイビングショップ',
                acquiredLocation: '沖縄県石垣市',
                specialtyTags: 'エンリッチド・エア, ディープ',
            }),
        );
    });

    it('必須項目が未入力のまま送信するとバリデーションエラーを表示し、アクションを呼ばない', async () => {
        const user = userEvent.setup();
        render(<CertificationForm />);

        await user.click(screen.getByRole('button', { name: '登録する' }));

        expect(await screen.findByText('指導団体を選択してください')).toBeInTheDocument();
        expect(screen.getByText('資格ランクを入力してください')).toBeInTheDocument();
        expect(screen.getByText('取得日を入力してください')).toBeInTheDocument();
        expect(createCertification).not.toHaveBeenCalled();
        expect(updateCertification).not.toHaveBeenCalled();
    });

    it('有効な値を入力して送信すると createCertification が値付きで呼ばれ、/settings/certifications へ遷移する', async () => {
        createCertification.mockResolvedValueOnce({ success: true, id: 'new-cert-id' });
        const user = userEvent.setup();
        render(<CertificationForm />);

        await user.selectOptions(screen.getByLabelText(/指導団体/), 'padi');
        await user.type(screen.getByLabelText(/資格ランク/), 'Open Water Diver');
        await user.type(screen.getByLabelText(/取得日/), '2024-03-15');
        await user.click(screen.getByRole('button', { name: '登録する' }));

        expect(createCertification).toHaveBeenCalledWith(
            expect.objectContaining({
                agency: 'padi',
                rank: 'Open Water Diver',
                acquiredOn: '2024-03-15',
            }),
        );
        expect(routerPush).toHaveBeenCalledWith('/settings/certifications');
        expect(routerRefresh).toHaveBeenCalled();
        expect(updateCertification).not.toHaveBeenCalled();
    });

    it('certificationId 指定時はボタン文言が「更新する」になり、updateCertification(certificationId, values) が呼ばれる', async () => {
        updateCertification.mockResolvedValueOnce({ success: true });
        const user = userEvent.setup();
        render(
            <CertificationForm
                certificationId="existing-cert-id"
                defaultValues={{
                    agency: 'naui',
                    rank: 'Advanced Scuba Diver',
                    acquiredOn: '2023-07-01',
                }}
            />,
        );

        expect(screen.getByRole('button', { name: '更新する' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: '更新する' }));

        expect(updateCertification).toHaveBeenCalledWith(
            'existing-cert-id',
            expect.objectContaining({
                agency: 'naui',
                rank: 'Advanced Scuba Diver',
                acquiredOn: '2023-07-01',
            }),
        );
        expect(routerPush).toHaveBeenCalledWith('/settings/certifications');
        expect(createCertification).not.toHaveBeenCalled();
    });

    it('createCertification が { success: false, error } を返すと role="alert" でエラーを表示し遷移しない', async () => {
        createCertification.mockResolvedValueOnce({ success: false, error: '資格の登録に失敗しました' });
        const user = userEvent.setup();
        render(<CertificationForm />);

        await user.selectOptions(screen.getByLabelText(/指導団体/), 'ssi');
        await user.type(screen.getByLabelText(/資格ランク/), 'Open Water Diver');
        await user.type(screen.getByLabelText(/取得日/), '2024-03-15');
        await user.click(screen.getByRole('button', { name: '登録する' }));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('資格の登録に失敗しました');
        expect(routerPush).not.toHaveBeenCalled();
    });

    it('未来日付を入力すると「取得日には今日以前の日付を入力してください」が表示される', async () => {
        const user = userEvent.setup();
        render(<CertificationForm />);

        await user.selectOptions(screen.getByLabelText(/指導団体/), 'padi');
        await user.type(screen.getByLabelText(/資格ランク/), 'Open Water Diver');
        await user.type(screen.getByLabelText(/取得日/), '2099-12-31');
        await user.click(screen.getByRole('button', { name: '登録する' }));

        expect(await screen.findByText('取得日には今日以前の日付を入力してください')).toBeInTheDocument();
        expect(createCertification).not.toHaveBeenCalled();
    });
});
