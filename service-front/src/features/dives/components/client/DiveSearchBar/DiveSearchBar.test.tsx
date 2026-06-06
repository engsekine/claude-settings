import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { DiveSearchBar } from './DiveSearchBar';

describe('DiveSearchBar', () => {
    it('search landmark として <search> を描画する', () => {
        // testing-library / jsdom が <search> 要素の暗黙ロール（search）を未対応のため、querySelector で代替
        const { container } = render(<DiveSearchBar onSubmit={vi.fn()} />);
        const searchLandmark = container.querySelector('search[aria-label="ダイビングログ検索"]');
        expect(searchLandmark).not.toBeNull();
    });

    it('検索ボタンを押すと入力値で onSubmit を呼ぶ', async () => {
        const handleSubmit = vi.fn();
        const user = userEvent.setup();
        render(<DiveSearchBar onSubmit={handleSubmit} />);

        await user.type(screen.getByLabelText('開始日'), '2026-01-01');
        await user.type(screen.getByLabelText('終了日'), '2026-12-31');
        await user.type(screen.getByLabelText('ポイント名'), '伊豆');
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
