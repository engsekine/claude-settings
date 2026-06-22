import { BEST_SEASON_MIN_DIVES, type SiteStats } from '@/features/dive-sites/types';

/** サイト別実績の集計対象（本人の当該サイトのログ） */
export interface SiteStatsInput {
    /** 潜水日（YYYY-MM-DD） */
    diveDate: string;
    /** 透明度（m）。未記録は null */
    visibilityM: number | null;
}

/** ベストシーズンとして提示する月数の上限 */
const BEST_SEASON_TOP_N = 3;

/** 月別本数の多い順（同数は月昇順）に上位 N 月を返す */
const topSeasonMonths = (dives: SiteStatsInput[]): number[] => {
    const countByMonth = new Map<number, number>();
    for (const dive of dives) {
        const month = Number(dive.diveDate.slice(5, 7));
        countByMonth.set(month, (countByMonth.get(month) ?? 0) + 1);
    }
    return [...countByMonth.entries()]
        .sort(([monthA, countA], [monthB, countB]) => countB - countA || monthA - monthB)
        .slice(0, BEST_SEASON_TOP_N)
        .map(([month]) => month);
};

/**
 * 本人のサイト別ログから実績（本数・平均透明度・ベストシーズン）を集計する純粋関数。
 * - 平均透明度: 透明度が記録されたログのみで平均（小数 1 桁）。0 件は null
 * - ベストシーズン: 月別本数の上位 3 ヶ月（同数は月昇順）。対象ログが 3 本未満なら空配列（傾向を出さない）
 */
export const calcSiteStats = (dives: SiteStatsInput[]): SiteStats => {
    const diveCount = dives.length;

    const visibilities = dives.map((dive) => dive.visibilityM).filter((value): value is number => value !== null);
    const avgVisibilityM =
        visibilities.length === 0
            ? null
            : Math.round((visibilities.reduce((sum, value) => sum + value, 0) / visibilities.length) * 10) / 10;

    const bestSeasonMonths = diveCount < BEST_SEASON_MIN_DIVES ? [] : topSeasonMonths(dives);

    return { diveCount, avgVisibilityM, bestSeasonMonths };
};
