import { calcBlankDays } from './blankDays';

describe('calcBlankDays', () => {
    it('過去のダイブ日からの経過日数を返す', () => {
        expect(calcBlankDays('2026-04-29', '2026-06-13')).toBe(45);
        expect(calcBlankDays('2026-06-03', '2026-06-13')).toBe(10);
    });

    it('当日のダイブは 0 を返す', () => {
        expect(calcBlankDays('2026-06-13', '2026-06-13')).toBe(0);
    });

    it('未来日のダイブ（先日付ログ）はマイナスにせず 0 に丸める', () => {
        expect(calcBlankDays('2026-06-20', '2026-06-13')).toBe(0);
        expect(calcBlankDays('2027-01-01', '2026-06-13')).toBe(0);
    });

    it('lastDiveOn が null（ログ 0 件）なら null を返す', () => {
        expect(calcBlankDays(null, '2026-06-13')).toBeNull();
    });

    it('月またぎ・年またぎも暦日差で計算する', () => {
        expect(calcBlankDays('2026-05-31', '2026-06-01')).toBe(1);
        expect(calcBlankDays('2025-12-31', '2026-01-01')).toBe(1);
        expect(calcBlankDays('2025-06-13', '2026-06-13')).toBe(365);
    });

    it('同一入力に対して常に同一の結果を返す', () => {
        const first = calcBlankDays('2026-04-29', '2026-06-13');
        const second = calcBlankDays('2026-04-29', '2026-06-13');
        expect(second).toBe(first);
    });
});
