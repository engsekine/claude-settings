import { describe, expect, it, vi } from 'vitest';

import { mapMutationError } from './errors';
import { OptimisticLockError, ReferencedError, hardDeleteRow, updateRow } from './mutations';

describe('updateRow（楽観ロック）', () => {
    it('UPDATE が 0 件（updated_at 不一致）なら OptimisticLockError を投げる（FR-022 / TOCTOU 回避）', async () => {
        // select('*')→before 取得、update().eq().eq().select('id')→[]（WHERE 不一致で 0 件）
        const updateChain = {
            eq: vi.fn(() => updateChain),
            select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
        const supabase = {
            from: vi.fn(() => ({
                select: vi.fn(() => ({
                    eq: vi.fn(() => ({
                        maybeSingle: vi.fn().mockResolvedValue({ data: { id: 'id1', updated_at: 'NOW-A' }, error: null }),
                    })),
                })),
                update: vi.fn(() => updateChain),
            })),
        };
        await expect(
            // biome-ignore lint/suspicious/noExplicitAny: テスト用モック
            updateRow(supabase as any, 'dive_sites', 'id1', { name: 'x' }, 'NOW-B', 'actor1'),
        ).rejects.toBeInstanceOf(OptimisticLockError);
    });
});

describe('hardDeleteRow（参照整合性）', () => {
    it('参照件数 > 0 なら ReferencedError を投げ、削除しない（FR-014）', async () => {
        const supabase = { from: vi.fn() };
        await expect(
            // biome-ignore lint/suspicious/noExplicitAny: テスト用モック
            hardDeleteRow(supabase as any, 'dive_sites', 'id1', 'actor1', 3),
        ).rejects.toBeInstanceOf(ReferencedError);
        expect(supabase.from).not.toHaveBeenCalled();
    });
});

describe('mapMutationError', () => {
    it('OptimisticLockError は再読み込みを促すメッセージ', () => {
        expect(mapMutationError(new OptimisticLockError())).toContain('再読み込み');
    });
    it('ReferencedError は参照件数を含むメッセージ', () => {
        expect(mapMutationError(new ReferencedError(5))).toContain('5');
    });
    it('一意制約違反(23505)は重複メッセージ', () => {
        expect(mapMutationError({ code: '23505' })).toContain('既に登録');
    });
    it('不明なエラーは汎用メッセージ', () => {
        expect(mapMutationError(new Error('boom'))).toContain('失敗');
    });
});
