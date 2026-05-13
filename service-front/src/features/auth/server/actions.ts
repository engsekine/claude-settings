'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/shared/lib/supabase/server';

export interface AuthActionResult {
    error?: string;
}

export interface SignUpResult extends AuthActionResult {
    /** 確認メールを送信した場合 true（ユーザーはまだログインしていない） */
    needsEmailConfirmation?: boolean;
}

export const signIn = async (email: string, password: string): Promise<AuthActionResult> => {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        return { error: 'メールアドレスまたはパスワードが間違っています' };
    }

    redirect('/dives');
};

export const signUp = async (email: string, password: string): Promise<SignUpResult> => {
    const supabase = await createClient();

    const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://localhost:3000';

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${siteUrl}/api/auth/callback?next=/dives`,
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
