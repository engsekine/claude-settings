import { render, screen, within } from '@testing-library/react';

import type { Plan } from '@/features/plans/types';

import { PlanList } from './PlanList';

const TODAY = '2026-06-10';

const buildPlan = (overrides: Partial<Plan> & Pick<Plan, 'id' | 'plannedOn' | 'location'>): Plan => ({
    notes: null,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    ...overrides,
});

const upcomingPlan = buildPlan({ id: 'p1', plannedOn: '2026-06-15', location: '伊豆 / 大瀬崎' });
const todayPlan = buildPlan({ id: 'p2', plannedOn: '2026-06-10', location: '沖縄 / 青の洞窟' });
const finishedPlan = buildPlan({ id: 'p3', plannedOn: '2026-06-01', location: '伊豆 / IOP' });

describe('PlanList', () => {
    it('これからの予定と終了済みをセクションで区分表示する', () => {
        render(<PlanList plans={[upcomingPlan, finishedPlan]} today={TODAY} />);

        const upcomingSection = screen.getByRole('region', { name: 'これからの予定' });
        expect(within(upcomingSection).getByText('伊豆 / 大瀬崎')).toBeInTheDocument();

        const finishedSection = screen.getByRole('region', { name: '終了済み' });
        expect(within(finishedSection).getByText('伊豆 / IOP')).toBeInTheDocument();
    });

    it('予定日が今日の予定は「今日」と表示する', () => {
        render(<PlanList plans={[todayPlan]} today={TODAY} />);

        expect(screen.getByText('今日')).toBeInTheDocument();
    });

    it('未来の予定は「あと N 日」を表示する', () => {
        render(<PlanList plans={[upcomingPlan]} today={TODAY} />);

        expect(screen.getByText('あと5日')).toBeInTheDocument();
    });

    it('終了済みの予定はバッジを表示し残り日数を表示しない', () => {
        render(<PlanList plans={[finishedPlan]} today={TODAY} />);

        expect(screen.getByText('終了済み', { selector: 'span' })).toBeInTheDocument();
        expect(screen.queryByText(/あと\d+日/)).not.toBeInTheDocument();
    });

    it('予定日を YYYY/MM/DD 形式で表示し詳細へのリンクを持つ', () => {
        render(<PlanList plans={[upcomingPlan]} today={TODAY} />);

        expect(screen.getByText('2026/06/15')).toBeInTheDocument();
        expect(screen.getByRole('link')).toHaveAttribute('href', '/plans/p1');
    });

    it('0 件時は CTA と新規作成への導線を表示する', () => {
        render(<PlanList plans={[]} today={TODAY} />);

        const ctaLink = screen.getByRole('link', { name: '次のダイビングを計画しよう' });
        expect(ctaLink).toHaveAttribute('href', '/plans/new');
    });
});
