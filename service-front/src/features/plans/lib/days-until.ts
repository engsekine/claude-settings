const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 予定日までの残り日数を返す純粋関数。
 *
 * - 今日 = 0、未来 = 正の値、過去 = 負の値（負の値は「終了済み」判定に使う）
 * - `today` は呼び出し側が `todayInJst()`（`@/shared/lib/date`）で渡す。
 *   引数化することでタイムゾーン起因のテストが決定的になる
 */
export const daysUntil = (plannedOn: string, today: string): number => {
    const planned = Date.parse(`${plannedOn}T00:00:00Z`);
    const base = Date.parse(`${today}T00:00:00Z`);
    return Math.round((planned - base) / MS_PER_DAY);
};
