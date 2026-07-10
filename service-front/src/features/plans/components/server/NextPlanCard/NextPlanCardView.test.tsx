import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import type { NextPlanSummary, PackingItem } from '@/features/plans/types';

const routerRefresh = vi.fn();

vi.mock('@/features/plans/server/actions', () => ({
    togglePackingItem: vi.fn(),
}));

vi.mock('next/navigation', () => ({
    useRouter: () => ({ refresh: routerRefresh }),
}));

import { NextPlanCardView } from './NextPlanCardView';

const buildItems = (checkedCount: number, totalCount: number): PackingItem[] =>
    Array.from({ length: totalCount }, (_, index) => ({
        id: `item-${index + 1}`,
        name: `持ち物${index + 1}`,
        isChecked: index < checkedCount,
        position: index,
    }));

const buildSummary = (overrides: Partial<NextPlanSummary> = {}): NextPlanSummary => ({
    id: 'plan-1',
    plannedOn: '2026-07-12',
    location: '伊豆 / 田子',
    notes: '夏の遠征。ボートダイブ予定。',
    daysUntil: 6,
    packingItems: [
        { id: 'item-1', name: 'マスク', isChecked: true, position: 0 },
        { id: 'item-2', name: 'フィン', isChecked: true, position: 1 },
        { id: 'item-3', name: 'ログブック', isChecked: true, position: 2 },
        { id: 'item-4', name: 'シュノーケル', isChecked: false, position: 3 },
        { id: 'item-5', name: 'ウェットスーツ', isChecked: false, position: 4 },
    ],
    ...overrides,
});

describe('NextPlanCardView', () => {
    it('予定日（曜日付き）・ポイント名・メモ・詳細への導線を表示する', () => {
        render(<NextPlanCardView summary={buildSummary()} />);

        expect(screen.getByText('2026/07/12（日）')).toBeInTheDocument();
        expect(screen.getByRole('heading', { level: 3, name: '伊豆 / 田子' })).toBeInTheDocument();
        expect(screen.getByText('夏の遠征。ボートダイブ予定。')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '予定の詳細' })).toHaveAttribute('href', '/plans/plan-1');
        expect(screen.getByRole('link', { name: '持ち物を準備する' })).toHaveAttribute('href', '/plans/plan-1');
    });

    it('予定日に対応する潮回りラベルを表示する', () => {
        render(<NextPlanCardView summary={buildSummary()} />);

        // 2026-07-12 は中潮（tide lib の対応表による）
        expect(screen.getByText('中潮')).toBeInTheDocument();
    });

    it('daysUntil が正のときは「あと N 日」バッジを表示する', () => {
        render(<NextPlanCardView summary={buildSummary({ daysUntil: 6 })} />);

        expect(screen.getByText('あと 6 日')).toBeInTheDocument();
    });

    it('daysUntil が 0 のときは「今日」を表示する', () => {
        render(<NextPlanCardView summary={buildSummary({ daysUntil: 0 })} />);

        expect(screen.getByText('今日')).toBeInTheDocument();
    });

    it('持ち物の進捗（件数・プログレスバー）を packingItems から集計して表示する', () => {
        render(<NextPlanCardView summary={buildSummary({ packingItems: buildItems(4, 12) })} />);

        expect(screen.getByText('4')).toBeInTheDocument();
        expect(screen.getByText('/ 12 準備済み')).toBeInTheDocument();
        const progressbar = screen.getByRole('progressbar', { name: '持ち物の準備進捗' });
        expect(progressbar).toHaveAttribute('aria-valuenow', '4');
        expect(progressbar).toHaveAttribute('aria-valuemax', '12');
    });

    it('未チェックを含む持ち物全件をチェックボックス付きで表示する', () => {
        render(<NextPlanCardView summary={buildSummary()} />);

        expect(screen.getAllByRole('checkbox')).toHaveLength(5);
        expect(screen.getByRole('checkbox', { name: 'マスク' })).toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'シュノーケル' })).not.toBeChecked();
        expect(screen.getByRole('checkbox', { name: 'ウェットスーツ' })).not.toBeChecked();
    });

    it('メモなしのときはメモ行を表示しない', () => {
        render(<NextPlanCardView summary={buildSummary({ notes: null })} />);

        expect(screen.queryByText('夏の遠征。ボートダイブ予定。')).not.toBeInTheDocument();
    });

    it('summary が null のときは空状態と予定作成の導線を表示する', () => {
        render(<NextPlanCardView summary={null} />);

        expect(screen.getByText('次のダイビングを計画しよう')).toBeInTheDocument();
        expect(screen.getByRole('link', { name: '予定を作成する' })).toHaveAttribute('href', '/plans/new');
    });
});
