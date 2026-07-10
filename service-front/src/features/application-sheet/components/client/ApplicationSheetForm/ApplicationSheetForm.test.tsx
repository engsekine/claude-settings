import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, vi } from 'vitest';

import { ApplicationSheetForm } from './ApplicationSheetForm';

const saveApplicationSheet = vi.fn();
const refresh = vi.fn();

vi.mock('../../../server/actions', () => ({
    saveApplicationSheet: (...args: unknown[]) => saveApplicationSheet(...args),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh }),
}));

/** プレビュー textarea の現在値を返す */
const previewValue = (): string => (screen.getByLabelText('生成テキスト') as HTMLTextAreaElement).value;

describe('ApplicationSheetForm', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        saveApplicationSheet.mockResolvedValue({ success: true, id: 'sheet-new' });
    });

    it('全入力項目が label 関連付けで存在する', () => {
        render(<ApplicationSheetForm />);

        // テキスト・数値・日付入力
        for (const label of [
            'シート名',
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

    it('レンタル「無」を選ぶとコンタクトレンズの有無・種類・度付きマスクの入力欄も表示されない（FR-011）', async () => {
        const user = userEvent.setup();
        render(<ApplicationSheetForm />);

        expect(screen.getByRole('group', { name: 'コンタクトレンズの有無' })).toBeInTheDocument();
        expect(screen.getByLabelText('コンタクトレンズの種類')).toBeInTheDocument();
        expect(screen.getByRole('group', { name: '度付きマスクレンタルの要否' })).toBeInTheDocument();

        const rentalGroup = screen.getByRole('group', { name: 'レンタル器材の有無' });
        await user.click(within(rentalGroup).getByLabelText('無'));

        expect(screen.queryByRole('group', { name: 'コンタクトレンズの有無' })).not.toBeInTheDocument();
        expect(screen.queryByLabelText('コンタクトレンズの種類')).not.toBeInTheDocument();
        expect(screen.queryByRole('group', { name: '度付きマスクレンタルの要否' })).not.toBeInTheDocument();
    });

    it('シート名を付けて保存すると saveApplicationSheet が呼ばれ、完了が role="status" で通知される（FR-010）', async () => {
        const user = userEvent.setup();
        render(<ApplicationSheetForm defaultValues={{ phone: '090-1234-5678' }} />);

        await user.type(screen.getByLabelText('シート名'), '〇〇ショップ用');
        await user.click(screen.getByRole('button', { name: 'シートを保存する' }));

        expect(saveApplicationSheet).toHaveBeenCalledTimes(1);
        expect(saveApplicationSheet).toHaveBeenCalledWith({
            sheetId: null,
            name: '〇〇ショップ用',
            values: expect.objectContaining({ phone: '090-1234-5678' }),
        });
        expect(await screen.findByText('保存しました')).toBeInTheDocument();
        expect(screen.getByText('保存しました').closest('[role="status"]')).not.toBeNull();
        expect(refresh).toHaveBeenCalled();
    });

    it('保存済みシートを開いた場合は上書き保存になり、シート名が初期表示される', async () => {
        const user = userEvent.setup();
        render(<ApplicationSheetForm sheetId="sheet-1" initialSheetName="〇〇ショップ用" />);

        expect(screen.getByLabelText('シート名')).toHaveValue('〇〇ショップ用');

        await user.click(screen.getByRole('button', { name: '上書き保存する' }));

        expect(saveApplicationSheet).toHaveBeenCalledWith({
            sheetId: 'sheet-1',
            name: '〇〇ショップ用',
            values: expect.anything(),
        });
    });

    it('新規保存に成功すると以降は上書き保存になる', async () => {
        const user = userEvent.setup();
        render(<ApplicationSheetForm />);

        await user.type(screen.getByLabelText('シート名'), '新しいシート');
        await user.click(screen.getByRole('button', { name: 'シートを保存する' }));

        expect(await screen.findByRole('button', { name: '上書き保存する' })).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: '上書き保存する' }));

        expect(saveApplicationSheet).toHaveBeenLastCalledWith(expect.objectContaining({ sheetId: 'sheet-new' }));
    });

    it('保存に失敗するとエラーメッセージが role="alert" で表示される', async () => {
        const user = userEvent.setup();
        saveApplicationSheet.mockResolvedValue({
            success: false,
            error: 'シート名を入力してください',
        });
        render(<ApplicationSheetForm />);

        await user.click(screen.getByRole('button', { name: 'シートを保存する' }));

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('シート名を入力してください');
    });
});
