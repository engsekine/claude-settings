'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { DiveFormValues } from '@/features/dives/schemas/dive.schema';
import { createClient } from '@/shared/lib/supabase/server';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

/** Postgres ユニーク制約違反のエラーコード */
const PG_UNIQUE_VIOLATION = '23505';

/** dives_user_id_dive_number_key 違反を判定 */
const isDiveNumberDuplicate = (error: { code?: string; message?: string } | null): boolean =>
    error?.code === PG_UNIQUE_VIOLATION && (error.message?.includes('dives_user_id_dive_number_key') ?? false);

/** DiveFormValues を DB の snake_case にマッピング */
const toDbRow = (input: DiveFormValues) => ({
    dive_number: input.diveNumber,
    dive_date: input.diveDate,
    entry_time: input.entryTime,
    exit_time: input.exitTime,
    location: input.location,
    dive_type: input.diveType,
    weather: input.weather,
    air_temp_c: input.airTempC,
    water_temp_c: input.waterTempC,
    visibility_m: input.visibilityM,
    wave: input.wave,
    current_condition: input.currentCondition,
    max_depth_m: input.maxDepthM,
    avg_depth_m: input.avgDepthM,
    bottom_time_min: input.bottomTimeMin,
    tank_type: input.tankType,
    tank_volume_l: input.tankVolumeL,
    gas_type: input.gasType,
    o2_percent: input.o2Percent,
    pressure_start_bar: input.pressureStartBar,
    pressure_end_bar: input.pressureEndBar,
    weight_kg: input.weightKg,
    suit_type: input.suitType,
    equipment_notes: input.equipmentNotes,
    buddy_name: input.buddyName,
    instructor_name: input.instructorName,
    certification_dive: input.certificationDive,
    notes: input.notes,
});

export const createDive = async (input: DiveFormValues): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return actionFailure('ログインが必要です');

    const { data, error } = await supabase
        .from('dives')
        .insert({ ...toDbRow(input), user_id: user.id })
        .select('id')
        .single();

    if (error || !data) {
        if (isDiveNumberDuplicate(error)) {
            return actionFailure(`ダイブ番号 ${input.diveNumber} はすでに使用されています`);
        }
        console.error('[createDive] supabase error:', error);
        return actionFailure('ログの作成に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePath('/dives');
    return actionSuccess({ id: data.id });
};

export const updateDive = async (id: string, input: DiveFormValues): Promise<ActionResult> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return actionFailure('ログインが必要です');

    const { error } = await supabase.from('dives').update(toDbRow(input)).eq('id', id);

    if (error) {
        if (isDiveNumberDuplicate(error)) {
            return actionFailure(`ダイブ番号 ${input.diveNumber} はすでに使用されています`);
        }
        console.error('[updateDive] supabase error:', error);
        return actionFailure('ログの更新に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePath('/dives');
    revalidatePath(`/dives/${id}`);
    return actionSuccess();
};

export const deleteDive = async (id: string): Promise<ActionResult> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return actionFailure('ログインが必要です');

    const { error } = await supabase.from('dives').delete().eq('id', id);

    if (error) {
        console.error('[deleteDive] supabase error:', error);
        return actionFailure('ログの削除に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePath('/dives');
    redirect('/dives');
};
