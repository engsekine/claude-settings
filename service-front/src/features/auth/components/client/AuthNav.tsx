'use client';

import Link from 'next/link';
import { useEffect } from 'react';

import { createBrowserClient } from '@/shared/lib/supabase';
import { useUserStore } from '@/shared/stores/user-store';

export const AuthNav = () => {
    const { isAuthenticated, user, setUser, clearUser } = useUserStore();

    /** Supabase Auth の状態変化を監視してストアに反映 */
    useEffect(() => {
        const supabase = createBrowserClient();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (session?.user) {
                    setUser(session.user);
                } else {
                    clearUser();
                }
            },
        );

        return () => subscription.unsubscribe();
    }, [setUser, clearUser]);

    const handleSignOut = async () => {
        const supabase = createBrowserClient();
        await supabase.auth.signOut();
    };

    if (!isAuthenticated) {
        return (
            <Link
                href="/login"
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                ログイン
            </Link>
        );
    }

    return (
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
                {user?.email}
            </span>
            <button
                type="button"
                onClick={() => void handleSignOut()}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                ログアウト
            </button>
        </div>
    );
};
