import { daysUntil } from '@/shared/lib/date';

export interface OverhaulInput {
    /** 前回 OH 日（YYYY-MM-DD） */
    lastOverhauledOn: string;
    /** OH 推奨周期（月） */
    intervalMonths: number;
    /** OH 推奨周期（本数） */
    intervalDives: number;
    /** 前回 OH 日以降に潜った本数 */
    divesSinceLastOverhaul: number;
    /** JST の今日（YYYY-MM-DD）。テスト容易性のため引数で受け取る */
    today: string;
}

export type OverhaulLevel = 'ok' | 'warning' | 'expired';

export interface OverhaulStatus {
    /** 次回 OH 期限日（YYYY-MM-DD） */
    nextOverhaulDate: string;
    /** 期限までの残り日数（負 = 超過） */
    remainingDays: number;
    /** 残り本数（負 = 超過） */
    remainingDives: number;
    level: OverhaulLevel;
}

/** 期限間近と判定する残り日数のしきい値 */
const WARNING_DAYS = 30;
/** 期限間近と判定する残り本数のしきい値 */
const WARNING_DIVES = 10;

/**
 * 月加算。加算後の月に存在しない日（例: 1/31 + 1 ヶ月）は月末日に丸める。
 */
const addMonths = (isoDate: string, months: number): string => {
    const [yearStr = '', monthStr = '', dayStr = ''] = isoDate.split('-');
    const y = Number(yearStr);
    const m = Number(monthStr);
    const d = Number(dayStr);
    const targetMonthIndex = m - 1 + months;
    const result = new Date(Date.UTC(y, targetMonthIndex, d));

    if (result.getUTCMonth() !== ((targetMonthIndex % 12) + 12) % 12) {
        // 日が溢れて翌月になった場合は対象月の月末に丸める
        const endOfMonth = new Date(Date.UTC(y, targetMonthIndex + 1, 0));
        return endOfMonth.toISOString().slice(0, 10);
    }
    return result.toISOString().slice(0, 10);
};

/**
 * レギュレーターの OH ステータスを計算する純粋関数。
 *
 * - 期限切れ（expired）: 残日数 <= 0 または 残本数 <= 0
 * - 期限間近（warning）: 残日数 <= 30 または 残本数 <= 10
 * - 余裕（ok）: それ以外
 */
export const calcOverhaulStatus = (input: OverhaulInput): OverhaulStatus => {
    const nextOverhaulDate = addMonths(input.lastOverhauledOn, input.intervalMonths);
    const remainingDays = daysUntil(nextOverhaulDate, input.today);
    const remainingDives = input.intervalDives - input.divesSinceLastOverhaul;

    if (remainingDays <= 0 || remainingDives <= 0) {
        return { nextOverhaulDate, remainingDays, remainingDives, level: 'expired' };
    }
    if (remainingDays <= WARNING_DAYS || remainingDives <= WARNING_DIVES) {
        return { nextOverhaulDate, remainingDays, remainingDives, level: 'warning' };
    }
    return { nextOverhaulDate, remainingDays, remainingDives, level: 'ok' };
};
