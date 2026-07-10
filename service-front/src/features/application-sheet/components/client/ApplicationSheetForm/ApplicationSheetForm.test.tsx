import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';

import { ApplicationSheetForm } from './ApplicationSheetForm';

const saveApplicationProfile = vi.fn();

vi.mock('../../../server/actions', () => ({
    saveApplicationProfile: (...args: unknown[]) => saveApplicationProfile(...args),
}));

/** プレビュー textarea の現在値を返す */
const previewValue = (): string => (screen.getByLabelText('生成テキスト') as HTMLTextAreaElement).value;

describe('ApplicationSheetForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        saveApplicationProfile.mockResolvedValue({ success: true });
    });

    it('全入力項目が label 関連付けで存在する', () => {
        render(<ApplicationSheetForm />);

        // テキスト・数値・日付入力
        for (const label of [
            'お名前',
            '年齢',
            '生年月日',
            '携帯電話',
            '緊急連絡先の続柄',
            '緊急連絡先の電話番号',
            '最寄りの駅',
            'ライセンスランク',
            '経験本数',
            '最終ダイブ年月',
            'ドライスーツの経験本数',
            '身長',
            '体重',
            '足のサイズ',
            'コンタクトレンズの種類',
            '性別',
        ]) {
            expect(screen.getByLabelText(label)).toBeInTheDocument();
        }

        // 有無系ラジオグループ（fieldset legend）
        for (const legend of [
            '伊豆・千葉でのダイビング経験',
            'ボートダイビングの経験',
            'ドライスーツの経験',
            'レンタル器材の有無',
            'コンタクトレンズの有無',
            '度付きマスクレンタルの要否',
        ]) {
            expect(screen.getByRole('group', { name: legend })).toBeInTheDocument();
        }
    });

    it('入力した値がプレビューに反映される（FR-004）', async () => {
        const user = userEvent.setup();
        render(<ApplicationSheetForm />);

        await user.type(screen.getByLabelText('お名前'), '山田 太郎');

        expect(previewValue()).toContain('・お名前（山田 太郎）');
    });

    it('未入力のままでもプレビューは空欄付きの全文を表示する（FR-005）', () => {
        render(<ApplicationSheetForm />);

        expect(previewValue()).toContain('・お名前（ ）');
        expect(previewValue()).toContain('・度付きのマスクレンタル必要の有無（ ）');
    });

    it('バリデーションエラーが role="alert" と aria-invalid で表示される', async () => {
        const user = userEvent.setup();
        render(<ApplicationSheetForm />);

        const phoneInput = screen.getByLabelText('携帯電話');
        await user.type(phoneInput, '090-abcd');
        await user.tab();

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('携帯電話は数字とハイフンで入力してください');
        expect(phoneInput).toHaveAttribute('aria-invalid', 'true');
    });

    it('defaultValues が各フィールドとプレビューに反映される', () => {
        render(<ApplicationSheetForm defaultValues={{ fullName: '佐藤 花子', licenseRank: 'Advanced' }} />);

        expect(screen.getByLabelText('お名前')).toHaveValue('佐藤 花子');
        expect(screen.getByLabelText('ライセンスランク')).toHaveValue('Advanced');
        expect(previewValue()).toContain('・お名前（佐藤 花子）');
    });

    it('自動入力された値を上書き修正すると出力に反映される（FR-008）', async () => {
        const user = userEvent.setup();
        render(<ApplicationSheetForm defaultValues={{ diveCount: '52' }} />);

        const diveCountInput = screen.getByLabelText('経験本数');
        expect(diveCountInput).toHaveValue('52');

        await user.clear(diveCountInput);
        await user.type(diveCountInput, '80');

        expect(previewValue()).toContain('・経験本数（80 本）');
    });

    it('レンタル「無」を選ぶと身長・体重・足のサイズの入力欄が表示されない（FR-011）', async () => {
        const user = userEvent.setup();
        render(<ApplicationSheetForm />);

        expect(screen.getByLabelText('身長')).toBeInTheDocument();

        const rentalGroup = screen.getByRole('group', { name: 'レンタル器材の有無' });
        await user.click(within(rentalGroup).getByLabelText('無'));

        expect(screen.queryByLabelText('身長')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('体重')).not.toBeInTheDocument();
        expect(screen.queryByLabelText('足のサイズ')).not.toBeInTheDocument();
    });

    it('保存ボタンで saveApplicationProfile が呼ばれ、完了が role="status" で通知される（FR-010）', async () => {
        const user = userEvent.setup();
        render(<ApplicationSheetForm defaultValues={{ phone: '090-1234-5678' }} />);

        await user.click(screen.getByRole('button', { name: '入力内容を保存する' }));

        expect(saveApplicationProfile).toHaveBeenCalledTimes(1);
        expect(saveApplicationProfile).toHaveBeenCalledWith(expect.objectContaining({ phone: '090-1234-5678' }));
        expect(await screen.findByText('保存しました')).toBeInTheDocument();
        expect(screen.getByText('保存しました').closest('[role="status"]')).not.toBeNull();
    });

    it('保存に失敗するとエラーメッセージが role="alert" で表示される', async () => {
        const user = userEvent.setup();
        saveApplicationProfile.mockResolvedValue({
            success: false,
            error: '保存に失敗しました。時間をおいて再度お試しください',
        });
        render(<ApplicationSheetForm />);

        await user.click(screen.getByRole('button', { name: '入力内容を保存する' }));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('保存に失敗しました。時間をおいて再度お試しください');
    });
});
