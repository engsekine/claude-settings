import { render, screen } from '@testing-library/react';

import type { DiveSite, SiteStats } from '@/features/dive-sites/types';

import { DiveSiteDetail } from './DiveSiteDetail';

const site: DiveSite = {
    id: 'site-1',
    name: '大瀬崎',
    area: '伊豆',
    country: 'JP',
    description: '初心者から上級者まで楽しめる定番ポイント',
};

const buildStats = (overrides: Partial<SiteStats> = {}): SiteStats => ({
    diveCount: 5,
    avgVisibilityM: 12.5,
    bestSeasonMonths: [6, 7, 8],
    ...overrides,
});

describe('DiveSiteDetail', () => {
    it('サイト名（エリア + 名称）と実績を表示する', () => {
        render(<DiveSiteDetail site={site} stats={buildStats()} />);
        expect(screen.getByRole('heading', { level: 1, name: '伊豆 / 大瀬崎' })).toBeInTheDocument();
        expect(screen.getByText('5本')).toBeInTheDocument();
        expect(screen.getByText('12.5m')).toBeInTheDocument();
        expect(screen.getByText('6月・7月・8月')).toBeInTheDocument();
    });

    it('ログ 0 件のときは実績の代わりに案内を表示する', () => {
        render(
            <DiveSiteDetail
                site={site}
                stats={buildStats({ diveCount: 0, avgVisibilityM: null, bestSeasonMonths: [] })}
            />,
        );
        expect(screen.getByText('まだこのサイトのダイブログがありません')).toBeInTheDocument();
        expect(screen.queryByText(/本$/)).not.toBeInTheDocument();
    });

    it('透明度が全て未記録なら平均は — を表示する', () => {
        render(<DiveSiteDetail site={site} stats={buildStats({ avgVisibilityM: null })} />);
        expect(screen.getByText('—')).toBeInTheDocument();
    });

    it('ベストシーズンが出せないときは不足の旨を表示する', () => {
        render(<DiveSiteDetail site={site} stats={buildStats({ diveCount: 2, bestSeasonMonths: [] })} />);
        expect(screen.getByText('傾向を出すにはログが不足しています')).toBeInTheDocument();
    });
});
