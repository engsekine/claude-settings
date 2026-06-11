import { describe, expect, it } from 'vitest';

import { daysUntil } from './days-until';

describe('daysUntil', () => {
    it('予定日が今日なら 0 を返す', () => {
        expect(daysUntil('2026-06-11', '2026-06-11')).toBe(0);
    });

    it('予定日が明日なら 1 を返す', () => {
        expect(daysUntil('2026-06-12', '2026-06-11')).toBe(1);
    });

    it('予定日が過去なら負の値を返す（終了済み判定に使う）', () => {
        expect(daysUntil('2026-06-10', '2026-06-11')).toBe(-1);
    });

    it('月をまたぐ日数を正しく計算する', () => {
        expect(daysUntil('2026-07-01', '2026-06-11')).toBe(20);
    });

    it('年をまたぐ日数を正しく計算する', () => {
        expect(daysUntil('2027-01-01', '2026-12-31')).toBe(1);
    });

    it('うるう年の 2/29 をまたいでも正しく計算する', () => {
        expect(daysUntil('2028-03-01', '2028-02-28')).toBe(2);
    });
});
