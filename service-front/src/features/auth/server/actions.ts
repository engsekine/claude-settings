'use server';

import { redirect } from 'next/navigation';

import type { Gender } from '@/shared/constants/gender';
import { createClient } from '@/shared/lib/supabase/server';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

import { toUserDetailsInsert } from './mappers/profile-completion';

/** signUp の成功ペイロード */
export interface SignUpPayload {
    /** 確認メールを送信した場合 true（ユーザーはまだログインしていない） */
    needsEmailConfirmation: boolean;
}

/** Google ログイン初回の補完で受け取るプロフィール（メール/パスワードを除く） */
export interface CompleteProfileInput {
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

/**
 * Google OAuth ログインを開始する（016-google-login）。
 * 成功時は Google の同意画面 URL へリダイレクトする（関数は戻らない）。
 * 戻り先（/api/auth/callback）は既存のメール認証コールバックと共通。
 */
export const signInWithGoogle = async (): Promise<ActionResult> => {
    const supabase = await createClient();

    const siteUrl = process.env['NEXT_PUBLIC_SITE_URL'] ?? 'https://localhost:3000';

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${siteUrl}/api/auth/callback?next=/dives`,
        },
    });

    if (error || !data.url) {
        return actionFailure('Google ログインを開始できませんでした。時間をおいて再度お試しください');
    }

    redirect(toBrowserReachableAuthorizeUrl(data.url));
};

/**
 * Server Action は SUPABASE_INTERNAL_URL（Docker 内 `host.docker.internal`）で
 * Supabase に接続するため、signInWithOAuth が返す authorize URL もその内部ホストになる。
 * しかしこの URL はブラウザが遷移する先なので、ブラウザから解決可能な
 * NEXT_PUBLIC_SUPABASE_URL（`127.0.0.1` 等）へオリジンを差し替える。
 * 両 env が未設定/同一の本番環境では何もしない。
 */
const toBrowserReachableAuthorizeUrl = (authorizeUrl: string): string => {
    const internalUrl = process.env['SUPABASE_INTERNAL_URL'];
    const publicUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    if (!internalUrl || !publicUrl) return authorizeUrl;

    const internalOrigin = new URL(internalUrl).origin;
    const publicOrigin = new URL(publicUrl).origin;
    if (internalOrigin === publicOrigin) return authorizeUrl;

    return authorizeUrl.startsWith(internalOrigin)
        ? `${publicOrigin}${authorizeUrl.slice(internalOrigin.length)}`
        : authorizeUrl;
};

/**
 * Google ログイン初回ユーザーのプロフィールを補完し、user_details に本人行を INSERT する。
 * user_id はクライアント入力ではなく auth.uid()（セッションユーザー）を使う。
 * 補完済みユーザーの再送（一意制約違反）は冪等に /dives へ流す。
 */
export const completeProfile = async (input: CompleteProfileInput): Promise<ActionResult> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return actionFailure('ログインが必要です');

    const { error } = await supabase.from('user_details').insert(toUserDetailsInsert(user.id, input));

    if (error) {
        /** 既に補完済み（PK 重複）の場合は冪等に成功扱いとし /dives へ */
        if (error.code === '23505') {
            redirect('/dives');
        }
        console.error('[completeProfile] supabase error:', {
            message: error.message,
            code: error.code,
        });
        return actionFailure('プロフィールの保存に失敗しました。時間をおいて再度お試しください');
    }

    redirect('/dives');
};
