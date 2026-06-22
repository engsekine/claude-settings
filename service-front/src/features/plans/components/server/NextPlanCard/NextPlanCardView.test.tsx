import { render, screen } from '@testing-library/react';

import type { NextPlanSummary } from '@/features/plans/types';

import { NextPlanCardView } from './NextPlanCardView';

const baseSummary: NextPlanSummary = {
    id: 'plan-1',
    plannedOn: '2026-06-20',
    location: '沖縄 / 青の洞窟',
    daysUntil: 9,
    checkedCount: 2,
    totalCount: 5,
};

describe('NextPlanCardView', () => {
    describe('予定がないとき', () => {
        it('CTA と作成ページへの導線を表示する', () => {
            render(<NextPlanCardView summary={null} />);
            expect(screen.getByText('次のダイビングを計画しよう')).toBeInTheDocument();
            expect(screen.getByRole('link', { name: '予定を作成する' })).toHaveAttribute('href', '/plans/new');
        });
    });

    describe('予定があるとき', () => {
        it('見出し・予定日・ポイント名と詳細ページへのリンクを表示する', () => {
            render(<NextPlanCardView summary={baseSummary} />);
            expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('次の予定');
            expect(screen.getByText('2026/06/20')).toBeInTheDocument();
            expect(screen.getByText('沖縄 / 青の洞窟')).toBeInTheDocument();
            expect(screen.getByRole('link')).toHaveAttribute('href', '/plans/plan-1');
        });

        it('予定日に対応する潮回りラベルを表示する', () => {
            // 2026-06-20 は新月の数日後（旧暦 5 日相当）= 中潮
            render(<NextPlanCardView summary={baseSummary} />);
            expect(screen.getByText('中潮')).toBeInTheDocument();
        });

        it('daysUntil が正のときは「あとN日」を表示する', () => {
            render(<NextPlanCardView summary={baseSummary} />);
            expect(screen.getByText('あと9日')).toBeInTheDocument();
        });

        it('daysUntil が 0 のときは「今日」を表示する', () => {
            render(<NextPlanCardView summary={{ ...baseSummary, daysUntil: 0 }} />);
            expect(screen.getByText('今日')).toBeInTheDocument();
        });

        it('未チェックが残るときは持ち物進捗を表示する', () => {
            render(<NextPlanCardView summary={baseSummary} />);
            expect(screen.getByText('2 / 5 準備済み')).toBeInTheDocument();
        });

        it('全件チェック済みのときは「準備完了」を表示する', () => {
            render(<NextPlanCardView summary={{ ...baseSummary, checkedCount: 5, totalCount: 5 }} />);
            expect(screen.getByText('準備完了')).toBeInTheDocument();
        });

        it('持ち物が 0 件のときは「0 / 0 準備済み」を表示する', () => {
            render(<NextPlanCardView summary={{ ...baseSummary, checkedCount: 0, totalCount: 0 }} />);
            expect(screen.getByText('0 / 0 準備済み')).toBeInTheDocument();
        });
    });
});
