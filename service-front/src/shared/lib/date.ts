/**
 * 日本時間の今日を YYYY-MM-DD で返す。
 *
 * UTC 基準だと JST 早朝（UTC では前日）に「今日」が未来日扱いになるため、
 * 日付入力の上限判定はこの値と文字列比較する（ISO 形式は辞書順 = 時系列順）。
 */
export const todayInJst = (): string => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });

/** YYYY-MM-DD の日付文字列が 1900-01-01 〜 当日の範囲内かチェック（生年月日用） */
export const isValidBirthDate = (value: string | undefined): boolean => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date >= new Date('1900-01-01') && date <= new Date();
};
