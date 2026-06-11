import { describe, expect, it } from 'vitest';

import { calcOverhaulStatus, type OverhaulInput } from './overhaul';

const baseInput: OverhaulInput = {
    lastOverhauledOn: '2026-01-01',
    intervalMonths: 12,
    intervalDives: 100,
    divesSinceLastOverhaul: 0,
    today: '2026-06-11',
};

describe('calcOverhaulStatus', () => {
    it('次回 OH 期限日 = 前回 OH 日 + 周期（月）', () => {
        const result = calcOverhaulStatus(baseInput);

        expect(result.nextOverhaulDate).toBe('2027-01-01');
    });

    it('月末日が溢れる場合は対象月の月末に丸める（1/31 + 1 ヶ月 = 2/28）', () => {
        const result = calcOverhaulStatus({ ...baseInput, lastOverhauledOn: '2026-01-31', intervalMonths: 1 });

        expect(result.nextOverhaulDate).toBe('2026-02-28');
    });

    describe('残日数の境界値（残本数は余裕がある状態）', () => {
        it('残 31 日は ok', () => {
            const result = calcOverhaulStatus({ ...baseInput, intervalMonths: 12, today: '2026-12-01' });
            expect(result.remainingDays).toBe(31);
            expect(result.level).toBe('ok');
        });

        it('残 30 日は warning', () => {
            const result = calcOverhaulStatus({ ...baseInput, intervalMonths: 12, today: '2026-12-02' });
            expect(result.remainingDays).toBe(30);
            expect(result.level).toBe('warning');
        });

        it('残 0 日（期限当日）は expired', () => {
            const result = calcOverhaulStatus({ ...baseInput, intervalMonths: 12, today: '2027-01-01' });
            expect(result.remainingDays).toBe(0);
            expect(result.level).toBe('expired');
        });

        it('期限超過は expired（残日数が負）', () => {
            const result = calcOverhaulStatus({ ...baseInput, intervalMonths: 12, today: '2027-02-01' });
            expect(result.remainingDays).toBeLessThan(0);
            expect(result.level).toBe('expired');
        });
    });

    describe('残本数の境界値（残日数は余裕がある状態）', () => {
        it('残 11 本は ok', () => {
            const result = calcOverhaulStatus({ ...baseInput, divesSinceLastOverhaul: 89 });
            expect(result.remainingDives).toBe(11);
            expect(result.level).toBe('ok');
        });

        it('残 10 本は warning', () => {
            const result = calcOverhaulStatus({ ...baseInput, divesSinceLastOverhaul: 90 });
            expect(result.remainingDives).toBe(10);
            expect(result.level).toBe('warning');
        });

        it('残 0 本は expired', () => {
            const result = calcOverhaulStatus({ ...baseInput, divesSinceLastOverhaul: 100 });
            expect(result.remainingDives).toBe(0);
            expect(result.level).toBe('expired');
        });
    });

    it('日数と本数の両方が間近なら warning（どちらかが切れるまで expired にしない）', () => {
        const result = calcOverhaulStatus({
            ...baseInput,
            today: '2026-12-15',
            divesSinceLastOverhaul: 95,
        });

        expect(result.level).toBe('warning');
    });
});
