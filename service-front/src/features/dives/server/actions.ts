'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import type { DiveFormValues } from '@/features/dives/schemas/dive.schema';
import { createClient } from '@/shared/lib/supabase/server';

export interface DiveActionResult {
    error?: string;
}

export interface CreateDiveResult extends DiveActionResult {
    id?: string;
}

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

export const createDive = async (input: DiveFormValues): Promise<CreateDiveResult> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'ログインが必要です' };

    const { data, error } = await supabase
        .from('dives')
        .insert({ ...toDbRow(input), user_id: user.id })
        .select('id')
        .single();

    if (error || !data) {
        console.error('[createDive] supabase error:', error);
        return { error: 'ログの作成に失敗しました。時間をおいて再度お試しください' };
    }

    revalidatePath('/dives');
    return { id: data.id as string };
};

export const updateDive = async (id: string, input: DiveFormValues): Promise<DiveActionResult> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'ログインが必要です' };

    const { error } = await supabase.from('dives').update(toDbRow(input)).eq('id', id);

    if (error) {
        console.error('[updateDive] supabase error:', error);
        return { error: 'ログの更新に失敗しました。時間をおいて再度お試しください' };
    }

    revalidatePath('/dives');
    revalidatePath(`/dives/${id}`);
    return {};
};

export const deleteDive = async (id: string): Promise<DiveActionResult> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'ログインが必要です' };

    const { error } = await supabase.from('dives').delete().eq('id', id);

    if (error) {
        console.error('[deleteDive] supabase error:', error);
        return { error: 'ログの削除に失敗しました。時間をおいて再度お試しください' };
    }

    revalidatePath('/dives');
    redirect('/dives');
};
