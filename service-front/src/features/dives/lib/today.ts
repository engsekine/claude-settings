/**
 * 日本時間（Asia/Tokyo）における今日の日付を `YYYY-MM-DD` 形式で返す。
 *
 * - HTML の `<input type="date">` がそのまま受け取れる形式
 * - 実行環境のタイムゾーン設定に依存しない（海外渡航中も日本時間で動作）
 * - `en-CA` ロケールは ISO 形式 `YYYY-MM-DD` を返す仕様
 */
export const todayInJst = (): string =>
    new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' });
