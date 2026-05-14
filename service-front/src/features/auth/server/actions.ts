'use server';

import { redirect } from 'next/navigation';

import type { Gender } from '@/shared/constants/gender';
import { createClient } from '@/shared/lib/supabase/server';

export interface AuthActionResult {
    error?: string;
}

export interface SignUpResult extends AuthActionResult {
    /** 確認メールを送信した場合 true（ユーザーはまだログインしていない） */
    needsEmailConfirmation?: boolean;
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
}

export const signIn = async (email: string, password: string): Promise<AuthActionResult> => {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: 'メールアドレスまたはパスワードが間違っています' };
    }

    redirect('/dives');
};

export const signUp = async (input: SignUpInput): Promise<SignUpResult> => {
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
            return { error: 'このメールアドレスは既に登録されています' };
        }
        return { error: 'サインアップに失敗しました。時間をおいて再度お試しください' };
    }

    /**
     * enable_confirmations = true の場合、session は null で identities は空配列。
     * ただし「既に登録済みのメール」でも Supabase は同じ形のレスポンスを返すため、
     * identities が空のときは情報漏洩防止のメッセージを差し戻す。
     */
    if (data.user && data.user.identities?.length === 0) {
        return { error: 'このメールアドレスは既に登録されています' };
    }

    return { needsEmailConfirmation: true };
};

export const signOut = async (): Promise<void> => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
};

export const requestPasswordReset = async (email: string): Promise<AuthActionResult> => {
    const supabase = await createClient();

    /** 登録済みかどうかに関わらず成功扱い（情報漏洩防止） */
    await supabase.auth.resetPasswordForEmail(email);

    return {};
};
