/** 一覧の既定ページサイズ */
export const DEFAULT_PER_PAGE = 20;

/** Next.js の searchParams（解決済み）の生の形 */
export type RawSearchParams = Record<string, string | string[] | undefined>;

/** searchParams から単一値を取り出す（配列なら先頭） */
export const firstParam = (searchParams: RawSearchParams, key: string): string | undefined => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
};

/** page クエリを正の整数に正規化する（不正値は 1） */
export const parsePage = (raw: string | undefined): number => {
    const value = Number(raw);
    return Number.isInteger(value) && value > 0 ? value : 1;
};

/** search クエリを正規化する（空文字は undefined） */
export const parseSearch = (raw: string | undefined): string | undefined => {
    const trimmed = raw?.trim();
    return trimmed ? trimmed : undefined;
};

/**
 * sort / dir クエリを並び替え指定に変換する。
 * column が許可リストに無い場合は undefined（無視）。
 */
export const parseSort = (
    column: string | undefined,
    dir: string | undefined,
    sortableColumns: readonly string[],
): { column: string; ascending: boolean } | undefined => {
    if (!column || !sortableColumns.includes(column)) return undefined;
    return { column, ascending: dir !== 'desc' };
};
