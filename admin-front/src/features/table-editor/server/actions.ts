'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/features/admin-auth';
import { mapMutationError } from '@/shared/lib/resource/errors';
import { hardDeleteRow, softDeleteRow } from '@/shared/lib/resource/mutations';
import { createClient } from '@/shared/lib/supabase/server';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

import { ALLOWED_TABLES, isAllowedTable } from '../constants';

/**
 * 汎用テーブルの行を削除する（FR-017）。
 * 許可リスト外のテーブルは拒否。deleted_at を持つテーブルはソフトデリート、
 * 持たないテーブルは物理削除（参照整合性は DB の FK 制約に委ねる）。
 */
export const deleteTableRow = async (table: string, id: string): Promise<ActionResult> => {
    const admin = await requireAdmin();
    if (!isAllowedTable(table)) {
        return actionFailure('許可されていないテーブルです');
    }

    const config = ALLOWED_TABLES[table];
    const supabase = await createClient();

    try {
        if (config.hasDeletedAt) {
            await softDeleteRow(supabase, table, id, admin.id);
        } else {
            // deleted_at を持たないテーブルは物理削除（参照ありは DB の FK で 23503 になり mapMutationError で説明）
            await hardDeleteRow(supabase, table, id, admin.id, 0);
        }
        revalidatePath(`/tables/${table}`);
        return actionSuccess();
    } catch (error) {
        return actionFailure(mapMutationError(error));
    }
};
