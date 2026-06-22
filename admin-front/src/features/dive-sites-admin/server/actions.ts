'use server';

import { revalidatePath } from 'next/cache';

import { requireAdmin } from '@/features/admin-auth';
import { firstValidationError, mapMutationError } from '@/shared/lib/resource/errors';
import { hardDeleteRow, insertRow, restoreRow, softDeleteRow, updateRow } from '@/shared/lib/resource/mutations';
import { createClient } from '@/shared/lib/supabase/server';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

import { type DiveSiteFormValues, diveSiteSchema } from '../schemas/dive-site.schema';
import { countReferencingDives } from './queries';

/** フォーム値を dive_sites の行値に変換（空文字は null に正規化） */
const toRowValues = (values: DiveSiteFormValues) => ({
    name: values.name,
    area: values.area ? values.area : null,
    country: values.country,
    description: values.description ? values.description : null,
});

/** ダイブサイトを新規作成（FR-011） */
export const createDiveSite = async (input: DiveSiteFormValues): Promise<ActionResult<{ id: string }>> => {
    const admin = await requireAdmin();

    let values: DiveSiteFormValues;
    try {
        values = await diveSiteSchema.validate(input, { abortEarly: false });
    } catch (error) {
        return actionFailure(firstValidationError(error));
    }

    const supabase = await createClient();
    try {
        const id = await insertRow(supabase, 'dive_sites', toRowValues(values), admin.id);
        revalidatePath('/dive-sites');
        return actionSuccess({ id });
    } catch (error) {
        return actionFailure(mapMutationError(error));
    }
};

/** ダイブサイトを編集（楽観ロック / FR-010・FR-022） */
export const updateDiveSite = async (
    id: string,
    input: DiveSiteFormValues,
    expectedUpdatedAt: string,
): Promise<ActionResult> => {
    const admin = await requireAdmin();

    let values: DiveSiteFormValues;
    try {
        values = await diveSiteSchema.validate(input, { abortEarly: false });
    } catch (error) {
        return actionFailure(firstValidationError(error));
    }

    const supabase = await createClient();
    try {
        await updateRow(supabase, 'dive_sites', id, toRowValues(values), expectedUpdatedAt, admin.id);
        revalidatePath('/dive-sites');
        revalidatePath(`/dive-sites/${id}/edit`);
        return actionSuccess();
    } catch (error) {
        return actionFailure(mapMutationError(error));
    }
};

/** ダイブサイトをソフトデリート（FR-013 / FR-018） */
export const softDeleteDiveSite = async (id: string): Promise<ActionResult> => {
    const admin = await requireAdmin();
    const supabase = await createClient();
    try {
        await softDeleteRow(supabase, 'dive_sites', id, admin.id);
        revalidatePath('/dive-sites');
        return actionSuccess();
    } catch (error) {
        return actionFailure(mapMutationError(error));
    }
};

/** ダイブサイトを復元 */
export const restoreDiveSite = async (id: string): Promise<ActionResult> => {
    const admin = await requireAdmin();
    const supabase = await createClient();
    try {
        await restoreRow(supabase, 'dive_sites', id, admin.id);
        revalidatePath('/dive-sites');
        return actionSuccess();
    } catch (error) {
        return actionFailure(mapMutationError(error));
    }
};

/** ダイブサイトを物理削除。参照しているダイブログがある間はブロック（FR-014） */
export const hardDeleteDiveSite = async (id: string): Promise<ActionResult> => {
    const admin = await requireAdmin();
    const supabase = await createClient();
    try {
        const referencing = await countReferencingDives(id);
        await hardDeleteRow(supabase, 'dive_sites', id, admin.id, referencing);
        revalidatePath('/dive-sites');
        return actionSuccess();
    } catch (error) {
        return actionFailure(mapMutationError(error));
    }
};
