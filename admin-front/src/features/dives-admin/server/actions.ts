'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/features/admin-auth';
import { firstValidationError, mapMutationError } from '@/shared/lib/resource/errors';
import { restoreRow, softDeleteRow, updateRow } from '@/shared/lib/resource/mutations';
import { createClient } from '@/shared/lib/supabase/server';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

import { type DiveEditFormValues, diveEditSchema } from '../schemas/dive-edit.schema';

const toRowValues = (values: DiveEditFormValues) => ({
    dive_date: values.dive_date,
    max_depth_m: values.max_depth_m,
    bottom_time_min: values.bottom_time_min,
    buddy_name: values.buddy_name ? values.buddy_name : null,
    notes: values.notes ? values.notes : null,
});

/** ダイブログを編集（楽観ロック / FR-010・FR-022） */
export const updateDive = async (
    id: string,
    input: DiveEditFormValues,
    expectedUpdatedAt: string,
): Promise<ActionResult> => {
    const admin = await requireAdmin();

    let values: DiveEditFormValues;
    try {
        values = await diveEditSchema.validate(input, { abortEarly: false });
    } catch (error) {
        return actionFailure(firstValidationError(error));
    }

    const supabase = await createClient();
    try {
        await updateRow(supabase, 'dives', id, toRowValues(values), expectedUpdatedAt, admin.id);
        revalidatePath('/dives');
        revalidatePath(`/dives/${id}`);
        return actionSuccess();
    } catch (error) {
        return actionFailure(mapMutationError(error));
    }
};

/** ダイブログをソフトデリート（FR-013 / FR-018） */
export const softDeleteDive = async (id: string): Promise<ActionResult> => {
    const admin = await requireAdmin();
    const supabase = await createClient();
    try {
        await softDeleteRow(supabase, 'dives', id, admin.id);
        revalidatePath('/dives');
        return actionSuccess();
    } catch (error) {
        return actionFailure(mapMutationError(error));
    }
};

/** ダイブログを復元 */
export const restoreDive = async (id: string): Promise<ActionResult> => {
    const admin = await requireAdmin();
    const supabase = await createClient();
    try {
        await restoreRow(supabase, 'dives', id, admin.id);
        revalidatePath('/dives');
        return actionSuccess();
    } catch (error) {
        return actionFailure(mapMutationError(error));
    }
};
