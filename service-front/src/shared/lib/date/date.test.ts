import { vi } from 'vitest';

import { isValidBirthDate, todayInJst } from './date';

describe('todayInJst', () => {
    it('YYYY-MM-DD 形式の文字列を返す', () => {
        expect(todayInJst()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('JST の日付を返す（UTC が前日でも JST の今日になる）', () => {
        vi.useFakeTimers();
        // UTC 2026-06-09 23:00 = JST 2026-06-10 08:00
        vi.setSystemTime(new Date('2026-06-09T23:00:00Z'));

        expect(todayInJst()).toBe('2026-06-10');

        vi.useRealTimers();
    });
});

describe('isValidBirthDate', () => {
    it('1900-01-01 〜 当日の範囲内なら true', () => {
        expect(isValidBirthDate('1990-01-01')).toBe(true);
        expect(isValidBirthDate('1900-01-01')).toBe(true);
    });

    it('1900-01-01 より前は false', () => {
        expect(isValidBirthDate('1899-12-31')).toBe(false);
    });

    it('未来日は false', () => {
        expect(isValidBirthDate('2999-01-01')).toBe(false);
    });

    it('不正な日付文字列は false', () => {
        expect(isValidBirthDate('invalid')).toBe(false);
    });

    it('undefined / 空文字は false', () => {
        expect(isValidBirthDate(undefined)).toBe(false);
        expect(isValidBirthDate('')).toBe(false);
    });
});
