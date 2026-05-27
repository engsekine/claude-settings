import type { User as SupabaseUser } from '@supabase/supabase-js';

import { useUserStore } from './user-store';

const buildUser = (overrides: Partial<SupabaseUser> = {}): SupabaseUser =>
    ({
        id: 'user-1',
        aud: 'authenticated',
        email: 'test@example.com',
        app_metadata: {},
        user_metadata: {},
        created_at: '2026-01-01T00:00:00.000Z',
        ...overrides,
    }) as SupabaseUser;

describe('useUserStore', () => {
    beforeEach(() => {
        useUserStore.setState({ user: null, isAuthenticated: false });
    });

    it('初期状態は user=null / isAuthenticated=false', () => {
        const { user, isAuthenticated } = useUserStore.getState();
        expect(user).toBeNull();
        expect(isAuthenticated).toBe(false);
    });

    it('setUser でユーザーを設定すると isAuthenticated=true になる', () => {
        const user = buildUser();
        useUserStore.getState().setUser(user);

        const state = useUserStore.getState();
        expect(state.user).toBe(user);
        expect(state.isAuthenticated).toBe(true);
    });

    it('clearUser で初期状態に戻る', () => {
        useUserStore.getState().setUser(buildUser());
        useUserStore.getState().clearUser();

        const state = useUserStore.getState();
        expect(state.user).toBeNull();
        expect(state.isAuthenticated).toBe(false);
    });
});
