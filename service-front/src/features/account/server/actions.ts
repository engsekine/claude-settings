'use server';

import { revalidatePath } from 'next/cache';

import type { DiverType } from '@/shared/constants/diver-type';
import type { Gender } from '@/shared/constants/gender';
import { createClient } from '@/shared/lib/supabase/server';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

import { toProfile, toUserDetailsUpdate } from './mappers/profile';

export interface UpdateProfileInput {
    lastName: string;
    firstName: string;
    lastNameRomaji: string;
    firstNameRomaji: string;
    nickname: string;
    /** ISO 8601 date string (YYYY-MM-DD) */
    birthOn: string;
    gender: Gender;
    /** 身長（cm）。任意入力 */
    heightCm: number | null;
    /** 体重（kg）。任意入力 */
    weightKg: number | null;
    /** ダイバー種別（019）。編集では任意（未選択=null 可） */
    diverType: DiverType | null;
    /** ダイバー番号（019）。インストラクターのみ・任意 */
    diverNumber: string | null;
}

export interface ProfileData {
    email: string;
    lastName: string;
    firstName: string;
    lastNameRomaji: string;
    firstNameRomaji: string;
    nickname: string;
    /** ISO 8601 date string (YYYY-MM-DD) */
    birthOn: string;
    gender: Gender;
    /** 身長（cm）。未登録時は null */
    heightCm: number | null;
    /** 体重（kg）。未登録時は null */
    weightKg: number | null;
    /** ダイバー種別（019）。未設定は null */
    diverType: DiverType | null;
    /** ダイバー番号（019）。未設定は null */
    diverNumber: string | null;
}

export const getProfile = async (): Promise<ProfileData | null> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    const { data, error } = await supabase
        .from('user_details')
        .select(
            'last_name, first_name, last_name_romaji, first_name_romaji, nickname, birth_on, gender, height_cm, weight_kg, diver_type, diver_number',
        )
        .eq('user_id', user.id)
        .single();

    if (error || !data) {
        console.error('[getProfile] failed to fetch user_details:', error);
        return null;
    }

    return toProfile(data, user.email ?? '');
};

export const updateProfile = async (input: UpdateProfileInput): Promise<ActionResult> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return actionFailure('ログインが必要です');

    const { error } = await supabase.from('user_details').update(toUserDetailsUpdate(input)).eq('user_id', user.id);

    if (error) {
        console.error('[updateProfile] supabase error:', {
            message: error.message,
            code: error.code,
        });
        return actionFailure('プロフィールの更新に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePath('/settings/profile');
    return actionSuccess();
};
