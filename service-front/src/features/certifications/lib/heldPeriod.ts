/** 保有期間（経過年月。月数切り捨て） */
export interface HeldPeriod {
    years: number;
    months: number;
}

const parseDateParts = (isoDate: string): { year: number; month: number; day: number } => {
    const [year = 0, month = 0, day = 0] = isoDate.split('-').map(Number);
    return { year, month, day };
};

/**
 * 取得日から基準日までの保有期間を返す純粋関数。
 * 両引数とも YYYY-MM-DD（JST 基準の値を渡す）。基準日の日が取得日の日に満たない月は
 * 1 ヶ月未満として切り捨てる（例: 1/31 取得 → 2/28 時点は 0 ヶ月）。最小は { years: 0, months: 0 }
 */
export const calcHeldPeriod = (acquiredOn: string, today: string): HeldPeriod => {
    const acquired = parseDateParts(acquiredOn);
    const base = parseDateParts(today);

    const monthDiff = (base.year - acquired.year) * 12 + (base.month - acquired.month);
    const totalMonths = Math.max(0, monthDiff - (base.day < acquired.day ? 1 : 0));

    return { years: Math.floor(totalMonths / 12), months: totalMonths % 12 };
};

/** 保有期間の表示文字列。1 年以上は「○年○ヶ月」、1 年未満は「○ヶ月」（取得当日は「0ヶ月」） */
export const formatHeldPeriod = ({ years, months }: HeldPeriod): string =>
    years >= 1 ? `${years}年${months}ヶ月` : `${months}ヶ月`;
