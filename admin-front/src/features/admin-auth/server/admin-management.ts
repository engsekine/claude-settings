'use server';

import { revalidatePath } from 'next/cache';

import { recordAudit } from '@/shared/lib/audit/recordAudit';
import { createClient } from '@/shared/lib/supabase/server';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

import { requireAdmin } from './guard';

/**
 * 管理者アカウントを無効化する（ソフトデリート / FR-015）。
 * 保護:
 *  - superadmin のみ実行可
 *  - 自分自身は無効化できない
 *  - 最後の有効な superadmin は無効化できない
 */
export const deactivateAdmin = async (targetId: string): Promise<ActionResult> => {
    const actor = await requireAdmin();

    if (actor.role !== 'superadmin') {
        return actionFailure('管理者の無効化は上位管理者のみ実行できます');
    }
    if (actor.id === targetId) {
        return actionFailure('自分自身を無効化することはできません');
    }

    const supabase = await createClient();

    // 対象の現在の状態を確認
    const { data: target, error: targetError } = await supabase
        .from('admin_users')
        .select('id, role, deleted_at')
        .eq('id', targetId)
        .maybeSingle();
    if (targetError) throw targetError;
    if (!target || target.deleted_at) {
        return actionFailure('対象の管理者が見つかりません');
    }

    // 最後の有効な superadmin を無効化させない
    if (target.role === 'superadmin') {
        const { count, error: countError } = await supabase
            .from('admin_users')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'superadmin')
            .is('deleted_at', null);
        if (countError) throw countError;
        if ((count ?? 0) <= 1) {
            return actionFailure('最後の上位管理者は無効化できません');
        }
    }

    const { error } = await supabase
        .from('admin_users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', targetId);
    if (error) {
        return actionFailure('管理者の無効化に失敗しました');
    }

    await recordAudit(supabase, actor.id, {
        action: 'soft_delete',
        targetTable: 'admin_users',
        targetId,
    });
    revalidatePath('/admins');
    return actionSuccess();
};
