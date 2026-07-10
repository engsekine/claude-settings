'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/shared/lib/auth';
import { createClient } from '@/shared/lib/supabase/server';
import { validateWithSchema } from '@/shared/lib/validation';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

import { MAX_APPLICATION_SHEETS, SHEET_NAME_MAX_LENGTH } from '../constants';
import { applicationSheetSchema } from '../schemas/application-sheet.schema';
import type { SheetFormValues, YesNoValue } from '../types';

interface SaveApplicationSheetInput {
    /** 上書き対象のシート ID。null なら新規保存 */
    sheetId: string | null;
    name: string;
    values: SheetFormValues;
}

/** 有無ラジオの値 → DB の nullable boolean（'' = 未入力は null） */
const toNullableBoolean = (value: YesNoValue): boolean | null => {
    if (value === 'yes') return true;
    if (value === 'no') return false;
    return null;
};

/** 数字文字列 → DB の nullable 数値（'' = 未入力は null） */
const toNullableNumber = (value: string): number | null => (value === '' ? null : Number(value));

/** フォーム全体のスナップショットを DB カラムへマッピングする */
const toDbRow = (name: string, values: SheetFormValues) => ({
    name,
    full_name: values.fullName,
    age: toNullableNumber(values.age),
    birth_on: values.birthOn === '' ? null : values.birthOn,
    gender: values.gender === '' ? null : values.gender,
    phone: values.phone,
    emergency_contact_relation: values.emergencyContactRelation,
    emergency_contact_phone: values.emergencyContactPhone,
    nearest_station: values.nearestStation,
    license_rank: values.licenseRank,
    dive_count: toNullableNumber(values.diveCount),
    has_izu_chiba_experience: toNullableBoolean(values.hasIzuChibaExperience),
    has_boat_experience: toNullableBoolean(values.hasBoatExperience),
    last_dive_year_month: values.lastDiveYearMonth === '' ? null : values.lastDiveYearMonth,
    has_dry_suit_experience: toNullableBoolean(values.hasDrySuitExperience),
    dry_suit_dive_count: toNullableNumber(values.drySuitDiveCount),
    has_rental: toNullableBoolean(values.hasRental),
    rental_items: values.rentalItems,
    omit_rental_block: values.omitRentalBlock,
    height_cm: toNullableNumber(values.heightCm),
    weight_kg: toNullableNumber(values.weightKg),
    foot_size_cm: toNullableNumber(values.footSizeCm),
    has_contact_lens: toNullableBoolean(values.hasContactLens),
    contact_lens_type: values.contactLensType === '' ? null : values.contactLensType,
    needs_prescription_mask: toNullableBoolean(values.needsPrescriptionMask),
});

/**
 * 申し込みシートを名前付きで保存する（新規 or 上書き）。
 * 保存対象はフォーム全体のスナップショット。個人情報を扱うため、エラーログに入力値は含めない。
 */
export const saveApplicationSheet = async (input: SaveApplicationSheetInput): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const { user, failure } = await requireUser(supabase);
    if (failure) return failure;

    const name = input.name.trim();
    if (name === '') return actionFailure('シート名を入力してください');
    if (name.length > SHEET_NAME_MAX_LENGTH) {
        return actionFailure(`シート名は${SHEET_NAME_MAX_LENGTH}文字以内で入力してください`);
    }

    const validation = await validateWithSchema(applicationSheetSchema, input.values);
    if (validation.error !== undefined) return actionFailure(validation.error);

    const row = toDbRow(name, validation.values);

    if (input.sheetId !== null) {
        // 上書き。RLS に加えて本人のシートであることを明示的に確認する
        const { data, error } = await supabase
            .from('application_sheets')
            .update(row)
            .eq('id', input.sheetId)
            .eq('user_id', user.id)
            .select('id')
            .maybeSingle();

        if (error) {
            console.error('[saveApplicationSheet] supabase error code:', error.code);
            return actionFailure('保存に失敗しました。時間をおいて再度お試しください');
        }
        if (!data) return actionFailure('保存先のシートが見つかりません');

        revalidatePath('/application-sheet');
        return actionSuccess({ id: data.id });
    }

    // 新規保存。無制限な行増加を防ぐため上限件数を確認する
    const { count, error: countError } = await supabase
        .from('application_sheets')
        .select('id', { count: 'exact', head: true });

    if (countError) {
        console.error('[saveApplicationSheet] supabase error code:', countError.code);
        return actionFailure('保存に失敗しました。時間をおいて再度お試しください');
    }
    if ((count ?? 0) >= MAX_APPLICATION_SHEETS) {
        return actionFailure(`保存できるシートは${MAX_APPLICATION_SHEETS}件までです。不要なシートを削除してください`);
    }

    const { data, error } = await supabase
        .from('application_sheets')
        .insert({ ...row, user_id: user.id })
        .select('id')
        .single();

    if (error || !data) {
        console.error('[saveApplicationSheet] supabase error code:', error?.code);
        return actionFailure('保存に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePath('/application-sheet');
    return actionSuccess({ id: data.id });
};

/** 保存済みシートを削除する（本人のシートのみ） */
export const deleteApplicationSheet = async (sheetId: string): Promise<ActionResult> => {
    const supabase = await createClient();

    const { user, failure } = await requireUser(supabase);
    if (failure) return failure;

    const { error } = await supabase.from('application_sheets').delete().eq('id', sheetId).eq('user_id', user.id);

    if (error) {
        console.error('[deleteApplicationSheet] supabase error code:', error.code);
        return actionFailure('削除に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePath('/application-sheet');
    return actionSuccess();
};
