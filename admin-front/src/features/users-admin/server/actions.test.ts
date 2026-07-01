import { beforeEach, describe, expect, it, vi } from 'vitest';

const { requireAdmin, createClient, createAdminServiceClient, recordAudit } = vi.hoisted(() => ({
    requireAdmin: vi.fn(),
    createClient: vi.fn(),
    createAdminServiceClient: vi.fn(),
    recordAudit: vi.fn(),
}));

vi.mock('@/features/admin-auth', () => ({ requireAdmin }));
vi.mock('@/shared/lib/supabase/server', () => ({ createClient }));
vi.mock('@/shared/lib/supabase/admin', () => ({ createAdminServiceClient }));
vi.mock('@/shared/lib/audit/recordAudit', () => ({ recordAudit }));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));

import { removeMfaFactor } from './actions';

interface ServiceMockOptions {
    factors?: { id: string; status: string }[];
    listError?: { message: string } | null;
    deleteError?: { message: string } | null;
}

const buildServiceMock = (options: ServiceMockOptions = {}) => {
    const { factors = [{ id: 'factor-1', status: 'verified' }], listError = null, deleteError = null } = options;
    const listFactors = vi.fn().mockResolvedValue({ data: { factors }, error: listError });
    const deleteFactor = vi.fn().mockResolvedValue({ data: {}, error: deleteError });
    return { client: { auth: { admin: { mfa: { listFactors, deleteFactor } } } }, listFactors, deleteFactor };
};

beforeEach(() => {
    requireAdmin.mockReset();
    createClient.mockReset();
    createAdminServiceClient.mockReset();
    recordAudit.mockReset();
    requireAdmin.mockResolvedValue({ id: 'admin-1', role: 'admin' });
    createClient.mockResolvedValue({});
});

describe('removeMfaFactor（FR-016）', () => {
    it('全 MFA 要素を削除し、監査ログを hard_delete で記録して成功を返す', async () => {
        const service = buildServiceMock({
            factors: [
                { id: 'factor-1', status: 'verified' },
                { id: 'factor-2', status: 'unverified' },
            ],
        });
        createAdminServiceClient.mockReturnValue(service.client);

        const result = await removeMfaFactor('user-1');

        expect(result).toEqual({ success: true });
        expect(service.deleteFactor).toHaveBeenCalledTimes(2);
        expect(service.deleteFactor).toHaveBeenCalledWith({ id: 'factor-1', userId: 'user-1' });
        expect(service.deleteFactor).toHaveBeenCalledWith({ id: 'factor-2', userId: 'user-1' });
        expect(recordAudit).toHaveBeenCalledWith(
            {},
            'admin-1',
            expect.objectContaining({ action: 'hard_delete', targetTable: 'mfa_factors', targetId: 'user-1' }),
        );
    });

    it('要素が無いユーザーは失敗を返し、削除も監査もしない', async () => {
        const service = buildServiceMock({ factors: [] });
        createAdminServiceClient.mockReturnValue(service.client);

        const result = await removeMfaFactor('user-1');

        expect(result.success).toBe(false);
        expect(service.deleteFactor).not.toHaveBeenCalled();
        expect(recordAudit).not.toHaveBeenCalled();
    });

    it('listFactors がエラーなら失敗を返す', async () => {
        const service = buildServiceMock({ listError: { message: 'boom' } });
        createAdminServiceClient.mockReturnValue(service.client);

        const result = await removeMfaFactor('user-1');

        expect(result.success).toBe(false);
        expect(service.deleteFactor).not.toHaveBeenCalled();
    });

    it('deleteFactor が失敗したら監査せず失敗を返す', async () => {
        const service = buildServiceMock({ deleteError: { message: 'boom' } });
        createAdminServiceClient.mockReturnValue(service.client);

        const result = await removeMfaFactor('user-1');

        expect(result.success).toBe(false);
        expect(recordAudit).not.toHaveBeenCalled();
    });

    it('未認証・非管理者は requireAdmin でリダイレクトされる（ここでは例外）', async () => {
        requireAdmin.mockRejectedValue(new Error('NEXT_REDIRECT:/login'));

        await expect(removeMfaFactor('user-1')).rejects.toThrow('NEXT_REDIRECT:/login');
        expect(createAdminServiceClient).not.toHaveBeenCalled();
    });
});
