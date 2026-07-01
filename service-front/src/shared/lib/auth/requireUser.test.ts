import type { User } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';

import { requireUser } from './requireUser';

const buildClient = (user: User | null) => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user } }) },
});

describe('requireUser', () => {
    it('ログイン済みなら user を返し failure は null', async () => {
        const user = { id: 'user-1' } as User;
        const result = await requireUser(buildClient(user));

        expect(result.failure).toBeNull();
        expect(result.user).toEqual(user);
    });

    it('未ログインなら ActionResult 互換の失敗を返す', async () => {
        const result = await requireUser(buildClient(null));

        expect(result.user).toBeNull();
        expect(result.failure).toEqual({ success: false, error: 'ログインが必要です' });
    });
});
