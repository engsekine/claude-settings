import { describe, expect, it } from 'vitest';

import { calcHeldPeriod, formatHeldPeriod } from './heldPeriod';

describe('calcHeldPeriod', () => {
    it('3 年 2 ヶ月前の取得日は { years: 3, months: 2 } になる', () => {
        expect(calcHeldPeriod('2023-04-01', '2026-06-12')).toEqual({ years: 3, months: 2 });
    });

    it('取得当日は { years: 0, months: 0 } になる', () => {
        expect(calcHeldPeriod('2026-06-12', '2026-06-12')).toEqual({ years: 0, months: 0 });
    });

    it('月末またぎは日が足りなければ 1 ヶ月未満として切り捨てる（1/31 取得 → 2/28 時点）', () => {
        expect(calcHeldPeriod('2026-01-31', '2026-02-28')).toEqual({ years: 0, months: 0 });
    });

    it('ちょうど 1 ヶ月で { years: 0, months: 1 } になる', () => {
        expect(calcHeldPeriod('2026-05-12', '2026-06-12')).toEqual({ years: 0, months: 1 });
    });

    it('1 年未満は months のみ加算される', () => {
        expect(calcHeldPeriod('2025-08-12', '2026-06-12')).toEqual({ years: 0, months: 10 });
    });

    it('ちょうど 1 年で { years: 1, months: 0 } になる', () => {
        expect(calcHeldPeriod('2025-06-12', '2026-06-12')).toEqual({ years: 1, months: 0 });
    });

    it('1 年まで 1 日足りない場合は 11 ヶ月に切り捨てる', () => {
        expect(calcHeldPeriod('2025-06-13', '2026-06-12')).toEqual({ years: 0, months: 11 });
    });
});

describe('formatHeldPeriod', () => {
    it('1 年以上は「○年○ヶ月」', () => {
        expect(formatHeldPeriod({ years: 3, months: 2 })).toBe('3年2ヶ月');
    });

    it('1 年ちょうどは「1年0ヶ月」', () => {
        expect(formatHeldPeriod({ years: 1, months: 0 })).toBe('1年0ヶ月');
    });

    it('1 年未満は「○ヶ月」', () => {
        expect(formatHeldPeriod({ years: 0, months: 11 })).toBe('11ヶ月');
    });

    it('取得当日は「0ヶ月」', () => {
        expect(formatHeldPeriod({ years: 0, months: 0 })).toBe('0ヶ月');
    });
});
