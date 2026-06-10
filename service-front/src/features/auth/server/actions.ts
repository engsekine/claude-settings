'use server';

import { redirect } from 'next/navigation';

import type { Gender } from '@/shared/constants/gender';
import { createClient } from '@/shared/lib/supabase/server';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

/** signUp の成功ペイロード */
export interface SignUpPayload {
    /** 確認メールを送信した場合 true（ユーザーはまだログインしていない） */
    needsEmailConfirmation: boolean;
}

export interface SignUpInput {
    email: string;
    password: string;
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

export const signIn = async (email: string, password: string): Promise<ActionResult> => {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return actionFailure('メールアドレスまたはパスワードが間違っています');
    }

    redirect('/dives');
};

export const signUp = async (input: SignUpInput): Promise<ActionResult<SignUpPayload>> => {
    const supabase = await createClient();

    const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://localhost:3000';

    const { data, error } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
            emailRedirectTo: `${siteUrl}/api/auth/callback?next=/dives`,
            /**
             * raw_user_meta_data に格納され、handle_new_user トリガーが
             * user_details への INSERT で参照する。
             */
            data: {
                last_name: input.lastName,
                first_name: input.firstName,
                last_name_romaji: input.lastNameRomaji,
                first_name_romaji: input.firstNameRomaji,
                nickname: input.nickname,
                birth_on: input.birthOn,
                gender: input.gender,
                height_cm: input.heightCm,
                weight_kg: input.weightKg,
            },
        },
    });

    if (error) {
        console.error('[signUp] supabase error:', {
            message: error.message,
            status: error.status,
            code: error.code,
            name: error.name,
        });
        if (error.message.includes('already registered')) {
            return actionFailure('このメールアドレスは既に登録されています');
        }
        return actionFailure('サインアップに失敗しました。時間をおいて再度お試しください');
    }

    /**
     * enable_confirmations = true の場合、session は null で identities は空配列。
     * ただし「既に登録済みのメール」でも Supabase は同じ形のレスポンスを返すため、
     * identities が空のときは情報漏洩防止のメッセージを差し戻す。
     */
    if (data.user && data.user.identities?.length === 0) {
        return actionFailure('このメールアドレスは既に登録されています');
    }

    return actionSuccess<SignUpPayload>({ needsEmailConfirmation: true });
};

export const signOut = async (): Promise<void> => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
};

export const requestPasswordReset = async (email: string): Promise<ActionResult> => {
    const supabase = await createClient();

    /** 登録済みかどうかに関わらず成功扱い（情報漏洩防止） */
    await supabase.auth.resetPasswordForEmail(email);

    return actionSuccess();
};
