'use client';

import Link from 'next/link';

import { useUserStore } from '@/shared/stores/user-store';

export const AuthNav = () => {
    const { isAuthenticated, user, clearUser } = useUserStore();

    if (!isAuthenticated) {
        return (
            <Link href="/login" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                ログイン
            </Link>
        );
    }

    return (
        <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.name}</span>
            <button
                type="button"
                onClick={clearUser}
                className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
                ログアウト
            </button>
        </div>
    );
};
