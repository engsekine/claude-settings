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

type DiveSupabaseClient = Awaited<ReturnType<typeof createClient>>;

/**
 * サイト参照と自由入力の排他・必須を再検証し、選択サイトの存在を確認する。
 * 問題なければ null、あればエラーメッセージを返す（DB CHECK の前段でのユーザー向けエラー）。
 */
const validateDiveSite = async (supabase: DiveSupabaseClient, input: DiveFormValues): Promise<string | null> => {
    const diveSiteId = input.diveSiteId ?? '';
    const hasSite = diveSiteId !== '';
    const hasLocation = input.location != null && input.location !== '';

    if (hasSite && hasLocation) return 'ポイントは選択と手入力のどちらか一方にしてください';
    if (!hasSite && !hasLocation) return 'ポイントを選択するか、ポイント名を入力してください';

    if (hasSite) {
        const { data, error } = await supabase.from('dive_sites').select('id').eq('id', diveSiteId).maybeSingle();
        if (error) {
            console.error('[validateDiveSite] supabase error:', error);
            return '選択したダイブサイトの確認に失敗しました。時間をおいて再度お試しください';
        }
        if (!data) return '選択したダイブサイトが見つかりません。再度選択してください';
    }

    return null;
};

/** サイト参照を使うか（マスタ選択あり） */
const usesDiveSite = (input: DiveFormValues): boolean => input.diveSiteId != null && input.diveSiteId !== '';

/** DiveFormValues を DB の snake_case にマッピング（サイト参照と location は排他） */
const toDbRow = (input: DiveFormValues) => ({
    dive_number: input.diveNumber,
    dive_date: input.diveDate,
    entry_time: input.entryTime,
    exit_time: input.exitTime,
    // 排他: サイト参照時は location を null、自由入力時は dive_site_id を null
    location: usesDiveSite(input) ? null : input.location,
    dive_site_id: usesDiveSite(input) ? input.diveSiteId : null,
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
    is_public: input.isPublic,
});

/** フォームのバディ入力を、DB 同期用に正規化する（自己タグ除外・重複除去・空要素除外） */
const normalizeBuddies = (
    buddies: DiveFormValues['buddies'],
    ownerId: string,
): { registeredUserIds: string[]; freetextNames: string[] } => {
    const registered = new Set<string>();
    const freetext = new Set<string>();
    for (const buddy of buddies ?? []) {
        const userId = buddy.userId?.trim();
        const name = buddy.name?.trim();
        // 登録ユーザー指定（自分自身は除外＝DB トリガの前段でユーザー向けに弾く）
        if (userId && userId !== ownerId) {
            registered.add(userId);
            continue;
        }
        if (!userId && name) freetext.add(name);
    }
    return { registeredUserIds: [...registered], freetextNames: [...freetext] };
};

/**
 * dive_log_buddies を入力内容に差分同期する（spec 021 FR-001〜003 / contracts/buddy-actions）。
 * - 追加: 既存に無い登録ユーザー / フリーテキストを INSERT
 * - 削除: 入力から消えた行を DELETE（本人除去済み行は RLS により対象外＝再タグ付けブロック維持）
 * dive 本体は保存済み前提。バディ同期の失敗はログのみ（本体保存は巻き戻さない）。
 */
const syncDiveBuddies = async (
    supabase: DiveSupabaseClient,
    diveId: string,
    ownerId: string,
    buddies: DiveFormValues['buddies'],
): Promise<void> => {
    const { registeredUserIds, freetextNames } = normalizeBuddies(buddies, ownerId);

    const { data: existing, error: fetchError } = await supabase
        .from('dive_log_buddies')
        .select('id, buddy_user_id, buddy_name')
        .eq('dive_id', diveId)
        .eq('removed_by_buddy', false);
    if (fetchError) {
        console.error('[syncDiveBuddies] fetch error:', fetchError);
        return;
    }

    const existingUserIds = new Set(
        (existing ?? []).map((r) => r.buddy_user_id).filter((v): v is string => v !== null),
    );
    const existingNames = new Set((existing ?? []).map((r) => r.buddy_name).filter((v): v is string => v !== null));

    const desiredUserIds = new Set(registeredUserIds);
    const desiredNames = new Set(freetextNames);

    // 削除対象: 既存のうち入力に無いもの
    const toDeleteIds = (existing ?? [])
        .filter((r) =>
            r.buddy_user_id
                ? !desiredUserIds.has(r.buddy_user_id)
                : !(r.buddy_name && desiredNames.has(r.buddy_name)),
        )
        .map((r) => r.id);

    // 追加対象: 入力のうち既存に無いもの
    const toInsert = [
        ...registeredUserIds
            .filter((id) => !existingUserIds.has(id))
            .map((id) => ({ dive_id: diveId, buddy_user_id: id, buddy_name: null })),
        ...freetextNames
            .filter((name) => !existingNames.has(name))
            .map((name) => ({ dive_id: diveId, buddy_user_id: null, buddy_name: name })),
    ];

    if (toDeleteIds.length > 0) {
        const { error } = await supabase.from('dive_log_buddies').delete().in('id', toDeleteIds);
        if (error) console.error('[syncDiveBuddies] delete error:', error);
    }
    if (toInsert.length > 0) {
        const { error } = await supabase.from('dive_log_buddies').insert(toInsert);
        if (error) console.error('[syncDiveBuddies] insert error:', error);
    }
};

export const createDive = async (input: DiveFormValues): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return actionFailure('ログインが必要です');

    const siteError = await validateDiveSite(supabase, input);
    if (siteError) return actionFailure(siteError);

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

    await syncDiveBuddies(supabase, data.id, user.id, input.buddies);

    revalidatePath('/dives');
    return actionSuccess({ id: data.id });
};

export const updateDive = async (id: string, input: DiveFormValues): Promise<ActionResult> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return actionFailure('ログインが必要です');

    const siteError = await validateDiveSite(supabase, input);
    if (siteError) return actionFailure(siteError);

    const { error } = await supabase.from('dives').update(toDbRow(input)).eq('id', id);

    if (error) {
        if (isDiveNumberDuplicate(error)) {
            return actionFailure(`ダイブ番号 ${input.diveNumber} はすでに使用されています`);
        }
        console.error('[updateDive] supabase error:', error);
        return actionFailure('ログの更新に失敗しました。時間をおいて再度お試しください');
    }

    await syncDiveBuddies(supabase, id, user.id, input.buddies);

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
