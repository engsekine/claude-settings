/**
 * Supabase の認証保証レベル（AAL）判定（023 / US2 / FR-010・FR-015）。
 * getAuthenticatorAssuranceLevel() の戻り（currentLevel / nextLevel）から、
 * 「1 段階目は済んだが 2 段階目（SMS）が未完了」の状態かを判定する。
 */
export interface AalLevels {
    currentLevel: string | null;
    nextLevel: string | null;
}

/**
 * 2 段階目の確認が保留中（保護ルートを遮断すべき状態）なら true。
 * - 2 要素認証を有効化しているユーザーがパスワード/Google で 1 段階目だけ通過した場合、
 *   currentLevel='aal1' かつ nextLevel='aal2' になる。
 * - 未有効化ユーザーは nextLevel='aal1' のままなので false（体験は不変 / FR-015）。
 * - 2 段階目まで完了すると currentLevel='aal2' になり false。
 */
export const isMfaChallengePending = (levels: AalLevels | null): boolean => {
    if (!levels) return false;
    return levels.currentLevel === 'aal1' && levels.nextLevel === 'aal2';
};
