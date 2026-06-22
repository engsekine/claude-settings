'use server';

import { redirect } from 'next/navigation';

import { createClient } from '@/shared/lib/supabase/server';
import { type ActionResult, actionFailure } from '@/shared/types/action-result';

import { getAdminUser } from './guard';

/**
 * 管理者ログイン（contracts/admin-auth.md）。
 * 認証成功後に管理者であることを確認し、管理者でなければ即サインアウトして
 * 利用者セッションを admin-front に残さない。
 */
export const signInAdmin = async (email: string, password: string): Promise<ActionResult> => {
    const supabase = await createClient();

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
        return actionFailure('メールアドレスまたはパスワードが間違っています');
    }

    const admin = await getAdminUser();
    if (!admin) {
        await supabase.auth.signOut();
        return actionFailure('管理者権限がありません');
    }

    redirect('/');
};

/** 管理者ログアウト。以降は全 (admin) URL にアクセス不可になる（FR-004） */
export const signOutAdmin = async (): Promise<void> => {
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
};
