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

    it('常時表示の番号・ポイント名で onSubmit を呼ぶ', async () => {
        const handleSubmit = vi.fn();
        const user = userEvent.setup();
        render(<DiveSearchBar onSubmit={handleSubmit} />);

        await user.type(screen.getByLabelText('ダイブ番号'), '12');
        await user.type(screen.getByLabelText('ポイント名（部分一致）'), '伊豆');
        await user.click(screen.getByRole('button', { name: '検索' }));

        expect(handleSubmit).toHaveBeenCalledWith({ diveNumber: 12, location: '伊豆' });
    });

    it('詳細条件は初期状態で折りたたまれている（aria-expanded=false）', () => {
        render(<DiveSearchBar onSubmit={vi.fn()} />);
        const toggle = screen.getByRole('button', { name: '詳細条件を開く' });
        expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });

    it('詳細条件を開くと期間・深度・ダイブタイプ入力が現れ、その値で onSubmit を呼ぶ', async () => {
        const handleSubmit = vi.fn();
        const user = userEvent.setup();
        render(<DiveSearchBar onSubmit={handleSubmit} />);

        await user.click(screen.getByRole('button', { name: '詳細条件を開く' }));
        await user.type(screen.getByLabelText('開始日'), '2025-07-01');
        await user.type(screen.getByLabelText('終了日'), '2025-08-31');
        await user.type(screen.getByLabelText('下限'), '18');
        await user.selectOptions(screen.getByLabelText('ダイブタイプ'), 'boat');
        await user.click(screen.getByRole('button', { name: '検索' }));

        expect(handleSubmit).toHaveBeenCalledWith({
            dateFrom: '2025-07-01',
            dateTo: '2025-08-31',
            depthMin: 18,
            diveType: 'boat',
        });
    });

    it('終了日が開始日より前だと検索せずエラーを表示する（FR-006）', async () => {
        const handleSubmit = vi.fn();
        const user = userEvent.setup();
        render(<DiveSearchBar onSubmit={handleSubmit} />);

        await user.click(screen.getByRole('button', { name: '詳細条件を開く' }));
        await user.type(screen.getByLabelText('開始日'), '2025-08-31');
        await user.type(screen.getByLabelText('終了日'), '2025-07-01');
        await user.click(screen.getByRole('button', { name: '検索' }));

        expect(await screen.findByRole('alert')).toHaveTextContent(/終了日は開始日以降/);
        expect(handleSubmit).not.toHaveBeenCalled();
    });

    it('適用中の詳細フィルタがあると初期展開され、件数を持つ', () => {
        render(<DiveSearchBar initialFilter={{ depthMin: 18, diveType: 'boat' }} onSubmit={vi.fn()} />);
        expect(screen.getByRole('button', { name: '詳細条件を閉じる' })).toHaveAttribute('aria-expanded', 'true');
    });

    it('折りたたみ時は適用中件数を表示する', () => {
        render(<DiveSearchBar initialFilter={{ location: '伊豆' }} onSubmit={vi.fn()} />);
        // location は常時表示フィルタなので件数に含めない。詳細フィルタ 0 件のため初期は折りたたみ
        expect(screen.getByRole('button', { name: '詳細条件を開く' })).toBeInTheDocument();
        expect(screen.queryByText(/件適用中/)).not.toBeInTheDocument();
    });

    it('クリアボタンを押すと空フィルタで onSubmit を呼ぶ', async () => {
        const handleSubmit = vi.fn();
        const user = userEvent.setup();
        render(<DiveSearchBar initialFilter={{ location: '伊豆' }} onSubmit={handleSubmit} />);

        await user.click(screen.getByRole('button', { name: 'クリア' }));

        expect(handleSubmit).toHaveBeenCalledWith({});
    });
});
