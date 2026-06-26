/**
 * 日本時間の今日を YYYY-MM-DD で返す。
 *
 * UTC 基準だと JST 早朝（UTC では前日）に「今日」が未来日扱いになるため、
 * 日付入力の上限判定はこの値と文字列比較する（ISO 形式は辞書順 = 時系列順）。
 */
export const todayInJst = (): string => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * 基準日から対象日までの日数を返す純粋関数。
 * 同日 = 0、未来 = 正、過去 = 負。両引数とも YYYY-MM-DD（JST 基準の値を渡す）。
 */
export const daysUntil = (targetDate: string, today: string): number => {
    const target = Date.parse(`${targetDate}T00:00:00Z`);
    const base = Date.parse(`${today}T00:00:00Z`);
    return Math.round((target - base) / MS_PER_DAY);
};

/** YYYY-MM-DD の日付文字列が 1900-01-01 〜 当日の範囲内かチェック（生年月日用） */
export const isValidBirthDate = (value: string | undefined): boolean => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date >= new Date('1900-01-01') && date <= new Date();
};
