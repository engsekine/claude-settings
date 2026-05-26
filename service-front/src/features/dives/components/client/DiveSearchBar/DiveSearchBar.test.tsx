import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DiveSearchBar } from './DiveSearchBar';

describe('DiveSearchBar', () => {
    it('search role の form を描画する', () => {
        render(<DiveSearchBar onSubmit={vi.fn()} />);
        expect(screen.getByRole('search', { name: 'ダイビングログ検索' })).toBeInTheDocument();
    });

    it('検索ボタンを押すと入力値で onSubmit を呼ぶ', async () => {
        const handleSubmit = vi.fn();
        const user = userEvent.setup();
        render(<DiveSearchBar onSubmit={handleSubmit} />);

        await user.type(screen.getByLabelText('開始日'), '2026-01-01');
        await user.type(screen.getByLabelText('終了日'), '2026-12-31');
        await user.type(screen.getByLabelText('エリア / ポイント名'), '伊豆');
        await user.click(screen.getByRole('button', { name: '検索' }));

        expect(handleSubmit).toHaveBeenCalledWith({
            dateFrom: '2026-01-01',
            dateTo: '2026-12-31',
            location: '伊豆',
        });
    });

    it('クリアボタンを押すと空フィルタで onSubmit を呼ぶ', async () => {
        const handleSubmit = vi.fn();
        const user = userEvent.setup();
        render(<DiveSearchBar initialFilter={{ location: '伊豆' }} onSubmit={handleSubmit} />);

        await user.click(screen.getByRole('button', { name: 'クリア' }));

        expect(handleSubmit).toHaveBeenCalledWith({});
    });
});
