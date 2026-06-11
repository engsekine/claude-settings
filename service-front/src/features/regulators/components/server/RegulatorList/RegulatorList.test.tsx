import { render, screen } from '@testing-library/react';

import type { Regulator } from '@/features/regulators/types';

import { RegulatorList } from './RegulatorList';

const buildRegulator = (overrides: Partial<Regulator> & Pick<Regulator, 'id' | 'brand' | 'model'>): Regulator => ({
    purchasedOn: null,
    lastOverhauledOn: '2026-01-15',
    overhaulIntervalMonths: 12,
    overhaulIntervalDives: 100,
    isPrimary: false,
    notes: null,
    createdAt: '2026-06-01T00:00:00Z',
    updatedAt: '2026-06-01T00:00:00Z',
    ...overrides,
});

const primaryRegulator = buildRegulator({
    id: 'r1',
    brand: 'SCUBAPRO',
    model: 'MK25 EVO',
    isPrimary: true,
    notes: '冬用にセッティング済み',
});

const subRegulator = buildRegulator({
    id: 'r2',
    brand: 'apeks',
    model: 'XTX200',
    lastOverhauledOn: '2025-11-01',
    overhaulIntervalMonths: 18,
    overhaulIntervalDives: 150,
});

describe('RegulatorList', () => {
    it('ブランド + モデル・前回 OH 日・OH 周期・メモを一覧表示する', () => {
        render(<RegulatorList regulators={[primaryRegulator, subRegulator]} />);

        expect(screen.getByRole('heading', { name: 'SCUBAPRO MK25 EVO' })).toBeInTheDocument();
        expect(screen.getByRole('heading', { name: 'apeks XTX200' })).toBeInTheDocument();
        expect(screen.getByText('2026/01/15')).toBeInTheDocument();
        expect(screen.getByText('12 ヶ月 / 100 本')).toBeInTheDocument();
        expect(screen.getByText('18 ヶ月 / 150 本')).toBeInTheDocument();
        expect(screen.getByText('冬用にセッティング済み')).toBeInTheDocument();
    });

    it('メイン機材（isPrimary）のカードにのみバッジを表示する', () => {
        render(<RegulatorList regulators={[primaryRegulator, subRegulator]} />);

        expect(screen.getAllByText('メイン機材')).toHaveLength(1);
    });

    it('0 件時は案内文と登録画面への導線を表示する', () => {
        render(<RegulatorList regulators={[]} />);

        expect(screen.getByText('レギュレーターを登録すると OH 期限をお知らせします')).toBeInTheDocument();
        const ctaLink = screen.getByRole('link', { name: 'レギュレーターを登録する' });
        expect(ctaLink).toHaveAttribute('href', '/settings/equipment/new');
    });

    it('renderActions の戻り値を各カードに描画する', () => {
        render(
            <RegulatorList
                regulators={[primaryRegulator, subRegulator]}
                renderActions={(regulator) => <button type="button">{regulator.model} を削除</button>}
            />,
        );

        expect(screen.getByRole('button', { name: 'MK25 EVO を削除' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'XTX200 を削除' })).toBeInTheDocument();
    });
});
