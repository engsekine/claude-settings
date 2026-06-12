import { render, screen } from '@testing-library/react';
import type { DiveListItem } from '@/features/dives/types';
import { DiveCard } from './DiveCard';

const baseDive: DiveListItem = {
    id: 'dive-1',
    diveNumber: 42,
    diveDate: '2026-04-15',
    location: '伊豆 / 大瀬崎',
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
});
