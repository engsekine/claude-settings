/**
 * Server Actions の戻り値の共通型（discriminated union）。
 *
 * `success` で成功/失敗を判別できるため、呼び出し側は
 * `if (!result.success)` でエラーメッセージへ型安全にアクセスできる。
 */
export type ActionResult<T extends object = Record<never, never>> =
    | ({ success: true } & T)
    | { success: false; error: string };

/** 成功レスポンスを作るヘルパー */
export const actionSuccess = <T extends object>(payload?: T): { success: true } & T =>
    ({ success: true, ...payload }) as { success: true } & T;

/** 失敗レスポンスを作るヘルパー */
export const actionFailure = (error: string): { success: false; error: string } => ({ success: false, error });
