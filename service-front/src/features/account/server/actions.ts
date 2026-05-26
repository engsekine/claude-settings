'use server';

import { revalidatePath } from 'next/cache';

import type { Gender } from '@/shared/constants/gender';
import { createClient } from '@/shared/lib/supabase/server';

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
}

export interface UpdateProfileResult {
    error?: string;
    success?: boolean;
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
            'last_name, first_name, last_name_romaji, first_name_romaji, nickname, birth_on, gender, height_cm, weight_kg',
        )
        .eq('user_id', user.id)
        .single();

    if (error || !data) {
        console.error('[getProfile] failed to fetch user_details:', error);
        return null;
    }

    return toProfile(data, user.email ?? '');
};

export const updateProfile = async (input: UpdateProfileInput): Promise<UpdateProfileResult> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: 'ログインが必要です' };

    const { error } = await supabase.from('user_details').update(toUserDetailsUpdate(input)).eq('user_id', user.id);

    if (error) {
        console.error('[updateProfile] supabase error:', {
            message: error.message,
            code: error.code,
        });
        return { error: 'プロフィールの更新に失敗しました。時間をおいて再度お試しください' };
    }

    revalidatePath('/settings/profile');
    return { success: true };
};
