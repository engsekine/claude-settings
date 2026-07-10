import { render, screen } from '@testing-library/react';

import { LandingPricing } from './LandingPricing';

describe('LandingPricing', () => {
    it('注入された価格・枠数を表示する（ハードコードしない）', () => {
        render(<LandingPricing packQuantity={10} packAmountJpy={300} initialGrantAmount={10} dailyBonusAmount={1} />);
        // ログパック価格（3 桁区切り + 円）
        expect(screen.getByText('300 円')).toBeInTheDocument();
        // 枠数・無料枠・デイリーボーナスが本文に反映される
        expect(screen.getByText(/10 枠まとめて追加/)).toBeInTheDocument();
        expect(screen.getByText(/ログ枠 10 枠をプレゼント/)).toBeInTheDocument();
        expect(screen.getByText(/毎日ログインで \+1 枠/)).toBeInTheDocument();
    });

    it('価格が変わっても props の値がそのまま表示に反映される', () => {
        render(<LandingPricing packQuantity={30} packAmountJpy={1000} initialGrantAmount={5} dailyBonusAmount={2} />);
        expect(screen.getByText('1,000 円')).toBeInTheDocument();
        expect(screen.getByText(/30 枠まとめて追加/)).toBeInTheDocument();
        expect(screen.getByText(/ログ枠 5 枠をプレゼント/)).toBeInTheDocument();
        expect(screen.getByText(/毎日ログインで \+2 枠/)).toBeInTheDocument();
    });
});
