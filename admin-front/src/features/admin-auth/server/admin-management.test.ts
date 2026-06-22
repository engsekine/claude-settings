import { describe, expect, it, vi } from 'vitest';

const { requireAdmin, createClient, recordAudit } = vi.hoisted(() => ({
    requireAdmin: vi.fn(),
    createClient: vi.fn(),
    recordAudit: vi.fn(),
}));

vi.mock('./guard', () => ({ requireAdmin }));
vi.mock('@/shared/lib/supabase/server', () => ({ createClient }));
vi.mock('@/shared/lib/audit/recordAudit', () => ({ recordAudit }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { deactivateAdmin } from './admin-management';

describe('deactivateAdmin（FR-015 保護）', () => {
    it('通常管理者は無効化できない', async () => {
        requireAdmin.mockResolvedValue({ id: 'a1', role: 'admin' });
        const result = await deactivateAdmin('a2');
        expect(result).toEqual({ success: false, error: '管理者の無効化は上位管理者のみ実行できます' });
    });

    it('自分自身は無効化できない', async () => {
        requireAdmin.mockResolvedValue({ id: 'a1', role: 'superadmin' });
        const result = await deactivateAdmin('a1');
        expect(result).toEqual({ success: false, error: '自分自身を無効化することはできません' });
    });

    it('最後の superadmin は無効化できない', async () => {
        requireAdmin.mockResolvedValue({ id: 'a1', role: 'superadmin' });
        createClient.mockResolvedValue({
            from: vi.fn(() => ({
                select: vi.fn((_cols: string, opts?: { head?: boolean }) => {
                    if (opts?.head) {
                        // superadmin の件数カウント（1 = 最後の 1 人）
                        return { eq: vi.fn(() => ({ is: vi.fn().mockResolvedValue({ count: 1, error: null }) })) };
                    }
                    // 対象の状態取得
                    return {
                        eq: vi.fn(() => ({
                            maybeSingle: vi.fn().mockResolvedValue({
                                data: { id: 'a2', role: 'superadmin', deleted_at: null },
                                error: null,
                            }),
                        })),
                    };
                }),
            })),
        });
        const result = await deactivateAdmin('a2');
        expect(result).toEqual({ success: false, error: '最後の上位管理者は無効化できません' });
    });
});
