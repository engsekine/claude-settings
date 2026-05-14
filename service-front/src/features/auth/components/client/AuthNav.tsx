'use client';

import type { User as SupabaseUser } from '@supabase/supabase-js';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';

import { signOut } from '@/features/auth/server/actions';
import { createClient } from '@/shared/lib/supabase/browser';
import { useUserStore } from '@/shared/stores/user-store';

interface AuthNavProps {
    /** SSR でサーバーから取得した初期ユーザー（ハイドレーションのちらつき防止） */
    initialUser: SupabaseUser | null;
}

export const AuthNav = ({ initialUser }: AuthNavProps) => {
    const storeUser = useUserStore((s) => s.user);
    const setUser = useUserStore((s) => s.setUser);
    const clearUser = useUserStore((s) => s.clearUser);
    const [isPending, startTransition] = useTransition();

    /**
     * ハイドレート完了フラグ。
     * ハイドレート前は initialUser を、後はストアの値を採用することで、
     * SSR/CSR の初回レンダリング結果を一致させちらつきを防ぐ。
     */
    const [hasHydrated, setHasHydrated] = useState(false);

    /** SSR で取得した初期ユーザーをストアに同期 */
    useEffect(() => {
        if (initialUser) {
            setUser(initialUser);
        } else {
            clearUser();
        }
        setHasHydrated(true);
    }, [initialUser, setUser, clearUser]);

    /**
     * Supabase Auth の状態変化を監視してストアに反映。
     * INITIAL_SESSION は Cookie 復元前のタイミングで session=null で発火し
     * initialUser を上書きしてしまうため無視する（初期状態は SSR を信頼する）。
     */
    useEffect(() => {
        const supabase = createClient();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'INITIAL_SESSION') return;

            if (session?.user) {
                setUser(session.user);
            } else {
                clearUser();
            }
        });

        return () => subscription.unsubscribe();
    }, [setUser, clearUser]);

    const handleSignOut = () => {
        startTransition(async () => {
            await signOut();
        });
    };

    const user = hasHydrated ? storeUser : initialUser;
    const isAuthenticated = !!user;

    if (!isAuthenticated) {
        return (
            <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                ログイン
            </Link>
        );
    }

    return (
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <button
                type="button"
                onClick={handleSignOut}
                disabled={isPending}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
            >
                {isPending ? 'ログアウト中...' : 'ログアウト'}
            </button>
        </div>
    );
};
