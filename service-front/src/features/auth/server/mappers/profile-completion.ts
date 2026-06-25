import type { Database } from '@repo/supabase';

import type { CompleteProfileInput } from '../actions';

type UserDetailsInsert = Database['public']['Tables']['user_details']['Insert'];

/**
 * ドメイン型 → user_details の INSERT ペイロード（snake_case）への変換。
 * Google ログイン初回の補完で本人行を新規作成するために使う。
 * user_id は呼び出し側が auth.uid() から渡す（クライアント入力を使わない）。
 */
export const toUserDetailsInsert = (userId: string, input: CompleteProfileInput): UserDetailsInsert => ({
    user_id: userId,
    last_name: input.lastName,
    first_name: input.firstName,
    last_name_romaji: input.lastNameRomaji,
    first_name_romaji: input.firstNameRomaji,
    nickname: input.nickname,
    birth_on: input.birthOn,
    gender: input.gender,
    height_cm: input.heightCm,
    weight_kg: input.weightKg,
});
