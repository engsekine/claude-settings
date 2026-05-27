const TIME_PATTERN = /^(\d{2}):(\d{2})(?::\d{2})?$/;
const DAY_MINUTES = 24 * 60;
const MAX_BOTTOM_TIME_MIN = 1440;

const parseTimeToMinutes = (value: string): number | null => {
    const match = value.match(TIME_PATTERN);
    if (!match) return null;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    if (hours > 23 || minutes > 59) return null;
    return hours * 60 + minutes;
};

/**
 * エントリー時刻とエキジット時刻から潜水時間（分）を算出する。
 *
 * - いずれかが null / 空 / 形式不正なら null を返す
 * - exit < entry のときはナイトダイブ等の日跨ぎとみなし +24h で計算する
 * - 同時刻（0 分）はスキーマ最小値（1 分）に満たないため null を返す
 * - 算出値がスキーマ最大値（1440 分）を超えるときは null を返す
 */
export const calcBottomTimeMin = (
    entry: string | null | undefined,
    exit: string | null | undefined,
): number | null => {
    if (!entry || !exit) return null;
    const entryMin = parseTimeToMinutes(entry);
    const exitMin = parseTimeToMinutes(exit);
    if (entryMin === null || exitMin === null) return null;

    let diff = exitMin - entryMin;
    if (diff < 0) diff += DAY_MINUTES;
    if (diff === 0) return null;
    if (diff > MAX_BOTTOM_TIME_MIN) return null;
    return diff;
};
