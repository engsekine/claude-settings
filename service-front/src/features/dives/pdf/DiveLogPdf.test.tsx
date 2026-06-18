import type { Dive } from '@/features/dives/types';

import { buildPdfData } from './build-pdf-data';
import { renderDiveLogPdf } from './DiveLogPdf';

const dive = (over: Partial<Dive> = {}): Dive =>
    ({
        id: 'd1',
        diveNumber: 12,
        diveDate: '2025-07-01',
        location: '伊豆 / 大瀬崎',
        diveSite: null,
        maxDepthM: 18.5,
        bottomTimeMin: 45,
        waterTempC: 24,
        tankType: 'aluminum',
        notes: 'カエルアンコウを観察。流れ強め。',
        pressureStartBar: 200,
        pressureEndBar: 50,
        ...over,
    }) as Dive;

describe('renderDiveLogPdf (integration)', () => {
    it('日本語ログを %PDF ヘッダー付きの Buffer に描画できる', async () => {
        const buffer = await renderDiveLogPdf(buildPdfData([dive()], new Map()));
        expect(buffer.length).toBeGreaterThan(1000);
        expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    });

    it('0 件でも案内ページの PDF を返す', async () => {
        const buffer = await renderDiveLogPdf(buildPdfData([], new Map()));
        expect(buffer.subarray(0, 5).toString('latin1')).toBe('%PDF-');
    });
});
