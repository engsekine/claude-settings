import { calcSiteStats } from './siteStats';

describe('calcSiteStats', () => {
    it('本数・平均透明度・ベストシーズンを集計する', () => {
        const stats = calcSiteStats([
            { diveDate: '2026-06-01', visibilityM: 10 },
            { diveDate: '2026-06-15', visibilityM: 20 },
            { diveDate: '2026-07-01', visibilityM: 15 },
        ]);
        expect(stats.diveCount).toBe(3);
        expect(stats.avgVisibilityM).toBe(15);
        // 6 月が 2 本で最多 → 先頭
        expect(stats.bestSeasonMonths[0]).toBe(6);
    });

    it('平均透明度は未記録（null）を除外して計算する', () => {
        const stats = calcSiteStats([
            { diveDate: '2026-06-01', visibilityM: 10 },
            { diveDate: '2026-06-02', visibilityM: null },
            { diveDate: '2026-06-03', visibilityM: 20 },
        ]);
        expect(stats.avgVisibilityM).toBe(15);
    });

    it('平均透明度は小数 1 桁に丸める', () => {
        const stats = calcSiteStats([
            { diveDate: '2026-06-01', visibilityM: 10 },
            { diveDate: '2026-06-02', visibilityM: 11 },
            { diveDate: '2026-06-03', visibilityM: 12 },
        ]);
        expect(stats.avgVisibilityM).toBe(11);
    });

    it('透明度が全て未記録なら平均は null', () => {
        const stats = calcSiteStats([
            { diveDate: '2026-06-01', visibilityM: null },
            { diveDate: '2026-06-02', visibilityM: null },
            { diveDate: '2026-06-03', visibilityM: null },
        ]);
        expect(stats.avgVisibilityM).toBeNull();
    });

    it('ベストシーズンは本数の多い月順・同数は月昇順で上位 3 ヶ月', () => {
        const stats = calcSiteStats([
            { diveDate: '2026-08-01', visibilityM: null },
            { diveDate: '2026-06-01', visibilityM: null },
            { diveDate: '2026-06-02', visibilityM: null },
            { diveDate: '2026-07-01', visibilityM: null },
            { diveDate: '2026-09-01', visibilityM: null },
        ]);
        // 6月=2、7/8/9月=1 → 6 が先頭、残りは月昇順で 7, 8
        expect(stats.bestSeasonMonths).toEqual([6, 7, 8]);
    });

    it('対象ログが 3 本未満ならベストシーズンは空（傾向を出さない）', () => {
        const stats = calcSiteStats([
            { diveDate: '2026-06-01', visibilityM: 10 },
            { diveDate: '2026-07-01', visibilityM: 12 },
        ]);
        expect(stats.diveCount).toBe(2);
        expect(stats.bestSeasonMonths).toEqual([]);
    });

    it('0 件は本数 0・平均 null・ベストシーズン空', () => {
        const stats = calcSiteStats([]);
        expect(stats).toEqual({ diveCount: 0, avgVisibilityM: null, bestSeasonMonths: [] });
    });
});
