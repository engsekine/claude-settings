import { render, screen } from '@testing-library/react';

import { getDashboardHero, getDiveStats, getPrimaryRegulatorStatus } from '@/features/dashboard/server/queries';

import { TopDashboard } from './TopDashboard';

vi.mock('@/features/dashboard/server/queries', () => ({
    getDashboardHero: vi.fn(),
    getDiveStats: vi.fn(),
    getPrimaryRegulatorStatus: vi.fn(),
}));

const mockHero = (blankDays: number | null) => {
    vi.mocked(getDashboardHero).mockResolvedValue({ nickname: 'テスト', blankDays });
    vi.mocked(getDiveStats).mockResolvedValue({
        totalDives: 0,
        totalBottomTimeMin: 0,
        maxDepthM: 0,
        visitedLocations: 0,
    });
    vi.mocked(getPrimaryRegulatorStatus).mockResolvedValue(null);
};

describe('TopDashboard（ヒーローのブランク日数分岐）', () => {
    it('blankDays が正の数ならブランク日数が表示される', async () => {
        mockHero(45);
        render(await TopDashboard({ recentDives: [] }));
        expect(screen.getByText(/最後に潜ってから/)).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('blankDays が 0 なら「0」と「今日もダイビング日和！」が表示される', async () => {
        mockHero(0);
        render(await TopDashboard({ recentDives: [] }));
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText('今日もダイビング日和！')).toBeInTheDocument();
    });

    it('blankDays が null（ログ 0 件）なら案内文言を表示しブランク日数は出さない', async () => {
        mockHero(null);
        render(await TopDashboard({ recentDives: [] }));
        expect(screen.getByText('まだダイブログがありません。最初の 1 本を記録しましょう')).toBeInTheDocument();
        expect(screen.queryByText(/最後に潜ってから/)).not.toBeInTheDocument();
    });
});
