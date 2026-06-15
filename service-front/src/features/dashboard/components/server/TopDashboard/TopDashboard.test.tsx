import { render, screen } from '@testing-library/react';

import {
    getDashboardHero,
    getDiveStats,
    getMonthlyDiveStats,
    getPrimaryRegulatorStatus,
    getYearlyDiveCounts,
} from '@/features/dashboard/server/queries';

import { TopDashboard } from './TopDashboard';

// Server Component のデータ取得をモックして組み立てだけ検証する
vi.mock('@/features/dashboard/server/queries', () => ({
    getDashboardHero: vi.fn(),
    getDiveStats: vi.fn(),
    getYearlyDiveCounts: vi.fn(),
    getMonthlyDiveStats: vi.fn(),
    getPrimaryRegulatorStatus: vi.fn(),
}));

const renderTopDashboard = async () => {
    // 非同期 Server Component は解決済みの要素として render する
    render(await TopDashboard({ recentDives: [] }));
};

const mockHappyPath = () => {
    vi.mocked(getDashboardHero).mockResolvedValue({ nickname: 'テスト', blankDays: 3 });
    vi.mocked(getDiveStats).mockResolvedValue({
        totalDives: 42,
        totalBottomTimeMin: 1885,
        maxDepthM: 32.5,
        visitedLocations: 18,
    });
    vi.mocked(getYearlyDiveCounts).mockResolvedValue([{ year: 2026, diveCount: 11 }]);
    vi.mocked(getMonthlyDiveStats).mockResolvedValue([
        { month: '2026-06', diveCount: 2, avgWaterTempC: 23.0, maxDepthM: 28.0 },
    ]);
    vi.mocked(getPrimaryRegulatorStatus).mockResolvedValue(null);
};

describe('TopDashboard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHappyPath();
    });

    it('「統計の推移」セクションを累計統計とともに表示する', async () => {
        await renderTopDashboard();
        expect(screen.getByRole('heading', { level: 2, name: '累計統計' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 2, name: '統計の推移' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: '年別ダイビング本数' })).toBeInTheDocument();
    });

    it('推移の集計が失敗してもページは落ちず、エラーメッセージを表示する', async () => {
        vi.mocked(getYearlyDiveCounts).mockRejectedValue(new Error('boom'));
        // テスト出力を汚さないよう console.error を黙らせる
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);

        await renderTopDashboard();

        expect(screen.getByRole('heading', { level: 2, name: '統計の推移' })).toBeInTheDocument();
        expect(screen.getByText(/集計に失敗しました/)).toBeInTheDocument();
        consoleError.mockRestore();
    });
});

describe('TopDashboard（ヒーローのブランク日数分岐）', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockHappyPath();
    });

    it('blankDays が正の数ならブランク日数が表示される', async () => {
        vi.mocked(getDashboardHero).mockResolvedValue({ nickname: 'テスト', blankDays: 45 });
        await renderTopDashboard();
        expect(screen.getByText(/最後に潜ってから/)).toBeInTheDocument();
        expect(screen.getByText('45')).toBeInTheDocument();
    });

    it('blankDays が 0 なら「0」と「今日もダイビング日和！」が表示される', async () => {
        vi.mocked(getDashboardHero).mockResolvedValue({ nickname: 'テスト', blankDays: 0 });
        await renderTopDashboard();
        expect(screen.getByText('0')).toBeInTheDocument();
        expect(screen.getByText('今日もダイビング日和！')).toBeInTheDocument();
    });

    it('blankDays が null（ログ 0 件）なら案内文言を表示しブランク日数は出さない', async () => {
        vi.mocked(getDashboardHero).mockResolvedValue({ nickname: 'テスト', blankDays: null });
        await renderTopDashboard();
        expect(screen.getByText('まだダイブログがありません。最初の 1 本を記録しましょう')).toBeInTheDocument();
        expect(screen.queryByText(/最後に潜ってから/)).not.toBeInTheDocument();
    });
});
