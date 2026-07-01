'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/features/admin-auth';
import { recordAudit } from '@/shared/lib/audit/recordAudit';
import { createAdminServiceClient } from '@/shared/lib/supabase/admin';
import { createClient } from '@/shared/lib/supabase/server';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

/**
 * 対象ユーザーの 2 要素認証要素をすべて解除する（023 / FR-016）。
 *
 * 電話紛失・番号変更時のリカバリー手段。Supabase Admin API（service_role）で
 * MFA 要素を削除し、監査ログに記録する。解除後、当該ユーザーは 2 段階目なしで
 * ログインでき、必要に応じて電話番号を再登録できる。
 */
export const removeMfaFactor = async (userId: string): Promise<ActionResult> => {
    const admin = await requireAdmin();

    const service = createAdminServiceClient();

    const { data, error } = await service.auth.admin.mfa.listFactors({ userId });
    if (error) {
        return actionFailure('2 要素認証要素の取得に失敗しました。時間をおいて再度お試しください');
    }

    const factors = data?.factors ?? [];
    if (factors.length === 0) {
        return actionFailure('このユーザーには解除できる 2 要素認証がありません');
    }

    /** 途中で失敗しても、実際に削除できた要素は必ず監査ログに残す（証跡欠落を防ぐ） */
    const removedFactorIds: string[] = [];
    let deleteFailed = false;
    for (const factor of factors) {
        const { error: deleteError } = await service.auth.admin.mfa.deleteFactor({ id: factor.id, userId });
        if (deleteError) {
            deleteFailed = true;
            break;
        }
        removedFactorIds.push(factor.id);
    }

    if (removedFactorIds.length > 0) {
        /** 監査ログは RLS クライアントで actor=管理者 ID として記録する（recordAudit 側の方針に準拠） */
        const supabase = await createClient();
        try {
            await recordAudit(supabase, admin.id, {
                action: 'hard_delete',
                targetTable: 'mfa_factors',
                targetId: userId,
                changes: { removedFactorIds },
            });
        } catch (auditError) {
            /** 監査ログ記録の失敗で解除自体は巻き戻さない。証跡欠落を検知できるようログには残す */
            console.error('MFA解除の監査ログ記録に失敗しました', auditError);
        }
        revalidatePath(`/users/${userId}`);
    }

    if (deleteFailed) {
        return actionFailure('2 要素認証要素の解除に失敗しました。時間をおいて再度お試しください');
    }

    return actionSuccess();
};
