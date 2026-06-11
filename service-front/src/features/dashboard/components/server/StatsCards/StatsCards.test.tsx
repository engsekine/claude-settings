import { render, screen } from '@testing-library/react';

import type { DiveStats } from '@/features/dashboard/types';

import { formatTotalBottomTime, StatsCards } from './StatsCards';

const baseStats: DiveStats = {
    totalDives: 42,
    totalBottomTimeMin: 1885,
    maxDepthM: 32.5,
    visitedLocations: 18,
};

describe('formatTotalBottomTime', () => {
    it('0 分は「0分」を返す', () => {
        expect(formatTotalBottomTime(0)).toBe('0分');
    });

    it('60 分未満は「YY分」を返す', () => {
        expect(formatTotalBottomTime(45)).toBe('45分');
    });

    it('60 分以上は「XX時間YY分」を返す', () => {
        expect(formatTotalBottomTime(1885)).toBe('31時間25分');
    });

    it('ちょうど 1 時間は「1時間0分」を返す', () => {
        expect(formatTotalBottomTime(60)).toBe('1時間0分');
    });

    it('100 時間超でも丸めず時間表記のまま返す', () => {
        expect(formatTotalBottomTime(7230)).toBe('120時間30分');
    });
});

describe('StatsCards', () => {
    describe('通常時', () => {
        it('4 つの統計をラベルつきで表示する', () => {
            render(<StatsCards stats={baseStats} />);
            expect(screen.getByText('累計ダイブ本数')).toBeInTheDocument();
            expect(screen.getByText('42 本')).toBeInTheDocument();
            expect(screen.getByText('累計潜水時間')).toBeInTheDocument();
            expect(screen.getByText('31時間25分')).toBeInTheDocument();
            expect(screen.getByText('最大水深')).toBeInTheDocument();
            expect(screen.getByText('32.5 m')).toBeInTheDocument();
            expect(screen.getByText('訪問スポット数')).toBeInTheDocument();
            expect(screen.getByText('18 スポット')).toBeInTheDocument();
        });

        it('累計潜水時間が 60 分未満のときは分のみ表示する', () => {
            render(<StatsCards stats={{ ...baseStats, totalBottomTimeMin: 45 }} />);
            expect(screen.getByText('45分')).toBeInTheDocument();
        });

        it('累計潜水時間が 100 時間超でも丸めず表示する', () => {
            render(<StatsCards stats={{ ...baseStats, totalBottomTimeMin: 7230 }} />);
            expect(screen.getByText('120時間30分')).toBeInTheDocument();
        });
    });

    describe('ログ 0 件のとき', () => {
        it('各値を 0 で表示する', () => {
            render(<StatsCards stats={{ totalDives: 0, totalBottomTimeMin: 0, maxDepthM: 0, visitedLocations: 0 }} />);
            expect(screen.getByText('0 本')).toBeInTheDocument();
            expect(screen.getByText('0分')).toBeInTheDocument();
            expect(screen.getByText('0 m')).toBeInTheDocument();
            expect(screen.getByText('0 スポット')).toBeInTheDocument();
        });
    });

    describe('集計失敗（stats が null）のとき', () => {
        it('失敗メッセージと各値「-」を表示する', () => {
            render(<StatsCards stats={null} />);
            expect(screen.getByRole('status')).toHaveTextContent('集計に失敗しました');
            expect(screen.getAllByText('-')).toHaveLength(4);
        });

        it('ラベルは通常時と同じく 4 つ表示する', () => {
            render(<StatsCards stats={null} />);
            expect(screen.getByText('累計ダイブ本数')).toBeInTheDocument();
            expect(screen.getByText('累計潜水時間')).toBeInTheDocument();
            expect(screen.getByText('最大水深')).toBeInTheDocument();
            expect(screen.getByText('訪問スポット数')).toBeInTheDocument();
        });
    });
});
