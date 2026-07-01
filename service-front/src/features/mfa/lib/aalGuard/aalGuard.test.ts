import { describe, expect, it } from 'vitest';

import { isMfaChallengePending } from './aalGuard';

describe('isMfaChallengePending', () => {
    it('aal1 → aal2 のとき保留中（遮断すべき）と判定する', () => {
        expect(isMfaChallengePending({ currentLevel: 'aal1', nextLevel: 'aal2' })).toBe(true);
    });

    it('未有効化（aal1 → aal1）は保留中ではない（体験不変 / FR-015）', () => {
        expect(isMfaChallengePending({ currentLevel: 'aal1', nextLevel: 'aal1' })).toBe(false);
    });

    it('2 段階目完了（aal2）は保留中ではない', () => {
        expect(isMfaChallengePending({ currentLevel: 'aal2', nextLevel: 'aal2' })).toBe(false);
    });

    it('null（取得失敗）は保留中扱いしない', () => {
        expect(isMfaChallengePending(null)).toBe(false);
    });
});
