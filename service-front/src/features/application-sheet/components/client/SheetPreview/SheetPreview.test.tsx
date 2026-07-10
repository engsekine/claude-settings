import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import { SheetPreview } from './SheetPreview';

const SAMPLE_TEXT = '・お名前（山田 太郎）\n・年齢（36 歳）';

describe('SheetPreview', () => {
    it('readonly の textarea に全文が表示される', () => {
        render(<SheetPreview text={SAMPLE_TEXT} />);

        const textarea = screen.getByLabelText('生成テキスト');
        expect(textarea).toHaveValue(SAMPLE_TEXT);
        expect(textarea).toHaveAttribute('readonly');
    });

    it('コピーボタン押下で clipboard に全文が渡り、role="status" で完了が通知される', async () => {
        const user = userEvent.setup();
        const writeText = vi.spyOn(navigator.clipboard, 'writeText');
        render(<SheetPreview text={SAMPLE_TEXT} />);

        await user.click(screen.getByRole('button', { name: 'コピーする' }));

        expect(writeText).toHaveBeenCalledWith(SAMPLE_TEXT);
        expect(screen.getByRole('status')).toHaveTextContent('コピーしました');
    });

    it('clipboard が使えない環境でもテキストは選択可能なまま案内が出る', async () => {
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText: vi.fn().mockRejectedValue(new Error('clipboard unavailable')) },
            configurable: true,
        });
        render(<SheetPreview text={SAMPLE_TEXT} />);

        fireEvent.click(screen.getByRole('button', { name: 'コピーする' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(
            'コピーできませんでした。テキストを選択して手動でコピーしてください',
        );
        expect(screen.getByLabelText('生成テキスト')).toHaveValue(SAMPLE_TEXT);
    });
});
