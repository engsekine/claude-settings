import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';

import type { Dive } from '@/features/dives/types';

import { DiveDetail } from './DiveDetail';

// 削除ボタンは Server Action に依存するためモックする（確認ダイアログの挙動は DeleteDiveButton 側でテスト済み）
vi.mock('@/features/dives/components/client/DeleteDiveButton', () => ({
    DeleteDiveButton: () => <button type="button">削除</button>,
}));

const baseDive: Dive = {
    id: 'dive-1',
    userId: 'user-1',
    diveNumber: 42,
    diveDate: '2026-04-15',
    entryTime: '09:30:00',
    exitTime: '10:18:00',
    location: '伊豆 / 大瀬崎',
    diveType: 'ファンダイブ',
    weather: '晴れ',
    airTempC: 22,
    waterTempC: 18.2,
    visibilityM: 12,
    wave: '穏やか',
    currentCondition: '弱い',
    maxDepthM: 22.5,
    avgDepthM: 14.8,
    bottomTimeMin: 48,
    tankType: null,
    tankVolumeL: null,
    gasType: null,
    o2Percent: null,
    pressureStartBar: 200,
    pressureEndBar: 60,
    weightKg: 5,
    suitType: 'ウェット 5mm',
    equipmentNotes: null,
    buddyName: null,
    instructorName: null,
    certificationDive: false,
    notes: null,
    isPublic: false,
    publicSlug: null,
    createdAt: '2026-04-15T12:00:00Z',
    updatedAt: '2026-04-15T12:00:00Z',
};

describe('DiveDetail', () => {
    it('location を見出しとして表示する', () => {
        render(<DiveDetail dive={baseDive} />);
        expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('伊豆 / 大瀬崎');
    });

    it('潜水日を YYYY/MM/DD 形式で表示する', () => {
        render(<DiveDetail dive={baseDive} />);
        expect(screen.getByText('2026/04/15')).toBeInTheDocument();
    });

    it('潜水日に対応する潮回りラベルを表示する', () => {
        // 2000-01-07 は基準朔の翌日 = 大潮（data-model.md 4 節の基準日付）
        render(<DiveDetail dive={{ ...baseDive, diveDate: '2000-01-07' }} />);
        expect(screen.getByText('大潮')).toBeInTheDocument();
    });

    it('日付が不正なときは潮回りラベルを表示しない', () => {
        render(<DiveDetail dive={{ ...baseDive, diveDate: 'invalid' }} />);
        expect(screen.queryByText(/大潮|中潮|小潮|長潮|若潮/)).not.toBeInTheDocument();
    });

    it('編集ページへのリンクを表示する', () => {
        render(<DiveDetail dive={baseDive} />);
        expect(screen.getByRole('link', { name: '編集' })).toHaveAttribute('href', '/dives/dive-1/edit');
    });

    it('講習ダイブのときはバッジを表示する', () => {
        render(<DiveDetail dive={{ ...baseDive, certificationDive: true }} />);
        expect(screen.getByText('講習ダイブ')).toBeInTheDocument();
    });
});
