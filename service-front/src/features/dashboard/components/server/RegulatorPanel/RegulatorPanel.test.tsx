import { render, screen } from '@testing-library/react';

import type { PrimaryRegulatorStatus } from '@/features/dashboard/types';

import { RegulatorPanel } from './RegulatorPanel';

const baseStatus: PrimaryRegulatorStatus = {
    regulatorId: 'reg-1',
    brand: 'SCUBAPRO',
    model: 'MK25 EVO',
    lastOverhauledOn: '2025-06-01',
    status: {
        nextOverhaulDate: '2026-06-01',
        remainingDays: 120,
        remainingDives: 25,
        level: 'ok',
    },
};

describe('RegulatorPanel', () => {
    describe('レギュレーター未登録のとき', () => {
        it('登録を促すメッセージと設定画面への導線を表示する', () => {
            render(<RegulatorPanel status={null} />);
            expect(screen.getByText('レギュレーターを登録すると OH 期限をお知らせします')).toBeInTheDocument();
            expect(screen.getByRole('link', { name: 'レギュレーターを登録する' })).toHaveAttribute(
                'href',
                '/settings/equipment',
            );
        });
    });

    describe('レベルが ok のとき', () => {
        it('機材名・次回 OH 期限・残り日数 / 残り本数と「余裕あり」を表示する', () => {
            render(<RegulatorPanel status={baseStatus} />);
            expect(screen.getByText('SCUBAPRO MK25 EVO')).toBeInTheDocument();
            expect(screen.getByText('次回 OH 期限: 2026/06/01')).toBeInTheDocument();
            expect(screen.getByText('残り120日 / 残り25本')).toBeInTheDocument();
            expect(screen.getByText('余裕あり')).toBeInTheDocument();
        });

        it('role="status" を付与しない', () => {
            render(<RegulatorPanel status={baseStatus} />);
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        });
    });

    describe('レベルが warning のとき', () => {
        it('「期限間近」を表示する', () => {
            const status: PrimaryRegulatorStatus = {
                ...baseStatus,
                status: { ...baseStatus.status, remainingDays: 14, remainingDives: 5, level: 'warning' },
            };
            render(<RegulatorPanel status={status} />);
            expect(screen.getByText('期限間近')).toBeInTheDocument();
            expect(screen.getByText('残り14日 / 残り5本')).toBeInTheDocument();
        });
    });

    describe('レベルが expired のとき', () => {
        const expiredStatus: PrimaryRegulatorStatus = {
            ...baseStatus,
            status: { ...baseStatus.status, remainingDays: -5, remainingDives: -2, level: 'expired' },
        };

        it('「期限切れ」を role="status" で表示する', () => {
            render(<RegulatorPanel status={expiredStatus} />);
            expect(screen.getByRole('status')).toHaveTextContent('期限切れ');
        });

        it('超過した日数・本数を表示する', () => {
            render(<RegulatorPanel status={expiredStatus} />);
            expect(screen.getByText('5日超過 / 2本超過')).toBeInTheDocument();
        });
    });

    describe('共通要素', () => {
        it('recordButton slot を描画する', () => {
            render(
                <RegulatorPanel status={baseStatus} recordButton={<button type="button">メンテ完了を記録</button>} />,
            );
            expect(screen.getByRole('button', { name: 'メンテ完了を記録' })).toBeInTheDocument();
        });

        it('機材管理ページへのリンクを表示する', () => {
            render(<RegulatorPanel status={baseStatus} />);
            expect(screen.getByRole('link', { name: '機材を管理' })).toHaveAttribute('href', '/settings/equipment');
        });
    });
});
