import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

import type { DiveListItem } from '@/features/dives/types';
import { DiveCard } from './DiveCard';

const baseDive: DiveListItem = {
    id: 'dive-1',
    diveNumber: 42,
    diveDate: '2026-04-15',
    location: '伊豆 / 大瀬崎',
    diveSite: null,
    maxDepthM: 22.5,
    bottomTimeMin: 48,
    waterTempC: 18.2,
    visibilityM: 12,
    certificationDive: false,
};

describe('DiveCard', () => {
    it('詳細ページへのリンクを描画する', () => {
        render(<DiveCard dive={baseDive} />);
        const link = screen.getByRole('link');
        expect(link).toHaveAttribute('href', '/dives/dive-1');
    });

    it('location を見出しとして表示する', () => {
        render(<DiveCard dive={baseDive} />);
        expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('伊豆 / 大瀬崎');
    });

    it('講習ダイブのときはバッジを表示する', () => {
        render(<DiveCard dive={{ ...baseDive, certificationDive: true }} />);
        expect(screen.getByText('講習ダイブ')).toBeInTheDocument();
    });

    it('数値項目（最大水深・潜水時間）を表示する', () => {
        render(<DiveCard dive={baseDive} />);
        expect(screen.getByText('22.5m')).toBeInTheDocument();
        expect(screen.getByText('48分')).toBeInTheDocument();
    });

    it('潜水日に対応する潮回りラベルを表示する', () => {
        // 2000-01-07 は基準朔の翌日 = 大潮（data-model.md 4 節の基準日付）
        render(<DiveCard dive={{ ...baseDive, diveDate: '2000-01-07' }} />);
        expect(screen.getByText('大潮')).toBeInTheDocument();
    });

    it('日付が不正なときは潮回りラベルを表示しない', () => {
        render(<DiveCard dive={{ ...baseDive, diveDate: 'invalid' }} />);
        expect(screen.queryByText(/大潮|中潮|小潮|長潮|若潮/)).not.toBeInTheDocument();
    });

    it('selectable=false（既定）のときチェックボックスを表示しない', () => {
        render(<DiveCard dive={baseDive} />);
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    });

    it('selectable=true のとき詳細ページへのリンクを描画しない（誤遷移防止）', () => {
        render(<DiveCard dive={baseDive} selectable />);
        expect(screen.queryByRole('link')).not.toBeInTheDocument();
    });

    it('selectable=true のときカード本文クリックで onToggleSelect に dive.id を渡す', async () => {
        const user = userEvent.setup();
        const onToggleSelect = vi.fn();
        render(<DiveCard dive={baseDive} selectable onToggleSelect={onToggleSelect} />);

        // チェックボックス自体ではなく本文（見出し）をクリックしても label 経由で選択が切り替わる
        await user.click(screen.getByRole('heading', { level: 2 }));
        expect(onToggleSelect).toHaveBeenCalledWith('dive-1');
    });

    it('selectable=true のとき選択チェックボックスを表示し、selected を反映する', () => {
        render(<DiveCard dive={baseDive} selectable selected />);
        const checkbox = screen.getByRole('checkbox', { name: /選択/ });
        expect(checkbox).toBeChecked();
    });

    it('チェックボックス操作で onToggleSelect に dive.id を渡す', async () => {
        const user = userEvent.setup();
        const onToggleSelect = vi.fn();
        render(<DiveCard dive={baseDive} selectable onToggleSelect={onToggleSelect} />);

        await user.click(screen.getByRole('checkbox', { name: /選択/ }));
        expect(onToggleSelect).toHaveBeenCalledWith('dive-1');
    });
});
