import { afterEach, vi } from 'vitest';

import { todayInJst } from './today';

afterEach(() => {
    vi.useRealTimers();
});

describe('todayInJst', () => {
    it('YYYY-MM-DD 形式の文字列を返す', () => {
        expect(todayInJst()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it('UTC 14:59（JST 23:59）はその日のままを返す', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-05T14:59:00Z'));
        expect(todayInJst()).toBe('2026-06-05');
    });

    it('UTC 15:00（JST 翌 00:00）は翌日を返す', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-05T15:00:00Z'));
        expect(todayInJst()).toBe('2026-06-06');
    });

    it('UTC 0:00（JST 09:00）はその日を返す', () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-06-05T00:00:00Z'));
        expect(todayInJst()).toBe('2026-06-05');
    });
});
