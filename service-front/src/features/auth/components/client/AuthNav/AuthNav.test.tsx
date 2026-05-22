import type { User as SupabaseUser } from '@supabase/supabase-js';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';

const signOut = vi.fn();
const mockStoreState: {
    user: SupabaseUser | null;
    setUser: ReturnType<typeof vi.fn>;
    clearUser: ReturnType<typeof vi.fn>;
} = {
    user: null,
    setUser: vi.fn(),
    clearUser: vi.fn(),
};

vi.mock('@/features/auth/server/actions', () => ({
    signOut: (...args: unknown[]) => signOut(...args),
}));

vi.mock('@/shared/lib/supabase/browser', () => ({
    createClient: () => ({
        auth: {
            onAuthStateChange: () => ({
                data: { subscription: { unsubscribe: vi.fn() } },
            }),
        },
    }),
}));

vi.mock('@/shared/stores/user-store', () => ({
    useUserStore: <T,>(selector: (state: typeof mockStoreState) => T): T => selector(mockStoreState),
}));

import { AuthNav } from './AuthNav';

const buildUser = (overrides: Partial<SupabaseUser> = {}): SupabaseUser =>
    ({
        id: 'user-1',
        email: 'user@example.com',
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: '2026-01-01T00:00:00Z',
        ...overrides,
    }) as SupabaseUser;

describe('AuthNav', () => {
    beforeEach(() => {
        signOut.mockReset();
        mockStoreState.user = null;
        mockStoreState.setUser.mockClear();
        mockStoreState.clearUser.mockClear();
    });

    it('未ログイン状態（initialUser=null）ではログインリンクを表示する', () => {
        render(<AuthNav initialUser={null} />);

        const loginLink = screen.getByRole('link', { name: 'ログイン' });
        expect(loginLink).toHaveAttribute('href', '/login');
    });

    it('ログイン済み状態ではメールアドレスとログアウトボタンを表示する', () => {
        const user = buildUser({ email: 'user@example.com' });
        mockStoreState.user = user;

        render(<AuthNav initialUser={user} />);

        const profileLink = screen.getByRole('link', { name: 'user@example.com' });
        expect(profileLink).toHaveAttribute('href', '/settings/profile');
        expect(screen.getByRole('button', { name: 'ログアウト' })).toBeInTheDocument();
    });

    it('ログアウトボタンを押すと signOut が呼ばれる', async () => {
        signOut.mockResolvedValue(undefined);
        const user = buildUser();
        mockStoreState.user = user;

        const userEventInstance = userEvent.setup();
        render(<AuthNav initialUser={user} />);

        await userEventInstance.click(screen.getByRole('button', { name: 'ログアウト' }));

        expect(signOut).toHaveBeenCalled();
    });
});
