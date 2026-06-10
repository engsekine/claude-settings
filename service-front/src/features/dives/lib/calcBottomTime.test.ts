import { calcBottomTimeMin } from './calcBottomTime';

describe('calcBottomTimeMin', () => {
    it('HH:MM 形式の差を分で返す', () => {
        expect(calcBottomTimeMin('09:00', '09:45')).toBe(45);
        expect(calcBottomTimeMin('10:15', '11:30')).toBe(75);
    });

    it('HH:MM:SS 形式も受理する（秒は切り捨て）', () => {
        expect(calcBottomTimeMin('09:00:00', '09:45:30')).toBe(45);
    });

    it('exit < entry なら日跨ぎとみなして +24h で計算する', () => {
        expect(calcBottomTimeMin('23:30', '00:15')).toBe(45);
        expect(calcBottomTimeMin('22:00', '01:00')).toBe(180);
    });

    it('entry または exit が null / undefined / 空文字なら null', () => {
        expect(calcBottomTimeMin(null, '09:45')).toBeNull();
        expect(calcBottomTimeMin('09:00', null)).toBeNull();
        expect(calcBottomTimeMin(undefined, undefined)).toBeNull();
        expect(calcBottomTimeMin('', '09:45')).toBeNull();
        expect(calcBottomTimeMin('09:00', '')).toBeNull();
    });

    it('形式が不正なら null', () => {
        expect(calcBottomTimeMin('9:00', '09:45')).toBeNull();
        expect(calcBottomTimeMin('09:00', 'abc')).toBeNull();
        expect(calcBottomTimeMin('24:00', '09:45')).toBeNull();
        expect(calcBottomTimeMin('09:60', '09:45')).toBeNull();
    });

    it('entry と exit が同じ時刻なら null（0 分は無効）', () => {
        expect(calcBottomTimeMin('09:00', '09:00')).toBeNull();
    });

    it('日跨ぎ計算で最大 1439 分まで取りうる', () => {
        expect(calcBottomTimeMin('00:01', '00:00')).toBe(1439);
    });
});
