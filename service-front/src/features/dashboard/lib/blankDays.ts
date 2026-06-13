import { daysUntil } from '@/shared/lib/date';

/**
 * ブランク日数（最後に潜ってから現在までの暦日差）を計算する純粋関数。
 *
 * - lastDiveOn が null（ログ 0 件）は null を返す（表示しない）
 * - 未来日のログ（先日付登録）は 0 に丸め、マイナスを返さない
 *
 * 両引数とも YYYY-MM-DD（JST 基準の値を渡す）。
 */
export const calcBlankDays = (lastDiveOn: string | null, today: string): number | null => {
    if (lastDiveOn === null) return null;
    // 過去日なので daysUntil は負になる。経過日数として正に反転し、下限 0 で丸める
    return Math.max(0, -daysUntil(lastDiveOn, today));
};
