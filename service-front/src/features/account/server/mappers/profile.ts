import type { Database } from '@repo/supabase';

import type { Gender } from '@/shared/constants/gender';

import type { ProfileData, UpdateProfileInput } from '../actions';

type UserDetailsRow = Database['public']['Tables']['user_details']['Row'];
type UserDetailsUpdate = Database['public']['Tables']['user_details']['Update'];

/** getProfile が SELECT する列だけを切り出した Row 型 */
export type ProfileRow = Pick<
    UserDetailsRow,
    | 'last_name'
    | 'first_name'
    | 'last_name_romaji'
    | 'first_name_romaji'
    | 'nickname'
    | 'birth_on'
    | 'gender'
    | 'height_cm'
    | 'weight_kg'
>;

/** DB Row → ドメイン型（camelCase）への変換 */
export const toProfile = (row: ProfileRow, email: string): ProfileData => ({
    email,
    lastName: row.last_name,
    firstName: row.first_name,
    lastNameRomaji: row.last_name_romaji,
    firstNameRomaji: row.first_name_romaji,
    nickname: row.nickname,
    birthOn: row.birth_on,
    gender: row.gender as Gender,
    heightCm: row.height_cm === null ? null : Number(row.height_cm),
    weightKg: row.weight_kg === null ? null : Number(row.weight_kg),
});

/** ドメイン型 → DB Update ペイロード（snake_case）への変換 */
export const toUserDetailsUpdate = (input: UpdateProfileInput): UserDetailsUpdate => ({
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
