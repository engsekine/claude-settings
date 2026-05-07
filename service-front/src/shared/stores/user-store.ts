import type { User as SupabaseUser } from '@supabase/supabase-js';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface UserStore {
    user: SupabaseUser | null;
    isAuthenticated: boolean;
    setUser: (user: SupabaseUser) => void;
    clearUser: () => void;
}

/**
 * ユーザーストア
 * Supabase Auth のユーザー情報をグローバルに管理
 * persist は使わない（Supabase が Cookie でセッション管理するため）
 */
export const useUserStore = create<UserStore>()(
    devtools(
        (set) => ({
            user: null,
            isAuthenticated: false,

            setUser: (user) =>
                set({ user, isAuthenticated: true }),

            clearUser: () =>
                set({ user: null, isAuthenticated: false }),
        }),
        { name: 'UserStore' },
    ),
);
