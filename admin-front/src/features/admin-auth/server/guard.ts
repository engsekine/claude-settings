import { redirect } from 'next/navigation';

import { createClient } from '@/shared/lib/supabase/server';

import type { AdminUser } from '../types';

/**
 * 現在のセッションが有効な管理者かを判定して返す（副作用なし）。
 * 未認証・非管理者・無効化済みの場合は null を返す。
 * proxy（一次ガード）や、リダイレクトせず分岐したい箇所で使う。
 */
export const getAdminUser = async (): Promise<AdminUser | null> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return null;

    // RLS（admins read admin users）により、管理者本人の行のみ取得できる。
    // deleted_at is null で無効化済みを除外する。
    const { data, error } = await supabase
        .from('admin_users')
        .select('id, display_name, role')
        .eq('id', user.id)
        .is('deleted_at', null)
        .maybeSingle();

    if (error || !data) return null;

    return {
        id: data.id,
        displayName: data.display_name,
        role: data.role === 'superadmin' ? 'superadmin' : 'admin',
    };
};

/**
 * 管理者であることを要求する二次ガード（多層防御 / SC-001）。
 * 全 queries.ts / actions.ts の冒頭で呼ぶ。
 *
 * 失敗時は署名アウト用 Route Handler 経由でログインへ誘導する。
 * 直接 /login に飛ばすと「認証済みだが非管理者」（無効化直後の管理者等）のセッションが残り、
 * proxy（認証済みは /login → /）との間で無限リダイレクトになるため。
 * Server Component のレンダリング中は Cookie を変更できないので、
 * signOut は Route Handler（/api/auth/signout）側で行う。
 */
export const requireAdmin = async (): Promise<AdminUser> => {
    const admin = await getAdminUser();
    if (!admin) redirect('/api/auth/signout');
    return admin;
};
