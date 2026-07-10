'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/shared/lib/auth';
import { createClient } from '@/shared/lib/supabase/server';
import { validateWithSchema } from '@/shared/lib/validation';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

import { applicationSheetSchema } from '../schemas/application-sheet.schema';
import type { SheetFormValues, YesNoValue } from '../types';

/** 有無ラジオの値 → DB の nullable boolean（'' = 未入力は null） */
const toNullableBoolean = (value: YesNoValue): boolean | null => {
    if (value === 'yes') return true;
    if (value === 'no') return false;
    return null;
};

/**
 * 保存対象（個人属性のみ・FR-010）を DB カラムへマッピングする。
 * 自動入力系（氏名・生年月日等）とレンタル選択・省略トグルは保存しない。
 */
const toDbRow = (values: SheetFormValues) => ({
    phone: values.phone,
    emergency_contact_relation: values.emergencyContactRelation,
    emergency_contact_phone: values.emergencyContactPhone,
    nearest_station: values.nearestStation,
    foot_size_cm: values.footSizeCm === '' ? null : Number(values.footSizeCm),
    has_izu_chiba_experience: toNullableBoolean(values.hasIzuChibaExperience),
    has_boat_experience: toNullableBoolean(values.hasBoatExperience),
    has_dry_suit_experience: toNullableBoolean(values.hasDrySuitExperience),
    dry_suit_dive_count: values.drySuitDiveCount === '' ? null : Number(values.drySuitDiveCount),
    has_contact_lens: toNullableBoolean(values.hasContactLens),
    contact_lens_type: values.contactLensType === '' ? null : values.contactLensType,
    needs_prescription_mask: toNullableBoolean(values.needsPrescriptionMask),
});

/**
 * 申し込みシートの個人属性を保存する（upsert・1 ユーザー 1 件・FR-010)。
 * 個人情報を扱うため、エラーログに入力値は含めない。
 */
export const saveApplicationProfile = async (input: SheetFormValues): Promise<ActionResult> => {
    const supabase = await createClient();

    const { user, failure } = await requireUser(supabase);
    if (failure) return failure;

    const validation = await validateWithSchema(applicationSheetSchema, input);
    if (validation.error !== undefined) return actionFailure(validation.error);

    const { error } = await supabase
        .from('application_profiles')
        .upsert({ ...toDbRow(validation.values), user_id: user.id });

    if (error) {
        console.error('[saveApplicationProfile] supabase error code:', error.code);
        return actionFailure('保存に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePath('/application-sheet');
    return actionSuccess();
};
