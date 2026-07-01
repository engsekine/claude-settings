import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('server-only', () => ({}));
vi.mock('next/cache', () => ({ revalidatePath: vi.fn() }));
vi.mock('@/shared/lib/supabase/server', () => ({ createClient: vi.fn() }));

import { createClient } from '@/shared/lib/supabase/server';

import { type UpdateProfileInput, updateProfile } from './actions';

const mockedCreateClient = vi.mocked(createClient);

const input: UpdateProfileInput = {
    lastName: '山田',
    firstName: '太郎',
    lastNameRomaji: 'Yamada',
    firstNameRomaji: 'Taro',
    nickname: 'たろちゃん',
    birthOn: '1990-01-01',
    gender: 'male',
    heightCm: null,
    weightKg: null,
    diverType: 'general',
    diverNumber: null,
};

interface ClientOptions {
    user?: { id: string } | null;
    nicknameTaken?: boolean;
    updateError?: { code?: string; message: string } | null;
}

const buildClient = ({ user = { id: 'user-1' }, nicknameTaken = false, updateError = null }: ClientOptions = {}) => {
    // update().eq() のチェーン。最終 await で updateError を返す thenable
    const eq = vi.fn();
    const updateBuilder = {
        eq,
        // biome-ignore lint/suspicious/noThenProperty: Supabase クエリビルダーは thenable のためモックでも then を実装する
        then: (resolve: (value: { error: { message: string } | null }) => void) => resolve({ error: updateError }),
    };
    eq.mockReturnValue(updateBuilder);
    const update = vi.fn(() => updateBuilder);
    const from = vi.fn(() => ({ update }));
    const rpc = vi.fn().mockResolvedValue({ data: nicknameTaken, error: null });
    const getUser = vi.fn().mockResolvedValue({ data: { user } });

    const client = { from, rpc, auth: { getUser } };
    mockedCreateClient.mockResolvedValue(client as never);
    return { client, from, update, rpc };
};

beforeEach(() => {
    vi.clearAllMocks();
});

describe('updateProfile', () => {
    it('更新成功で success を返す', async () => {
        const { update } = buildClient();

        const result = await updateProfile(input);

        expect(update).toHaveBeenCalled();
        expect(result).toEqual({ success: true });
    });

    it('未ログインなら失敗を返す', async () => {
        const { update } = buildClient({ user: null });

        const result = await updateProfile(input);

        expect(result).toEqual({ success: false, error: 'ログインが必要です' });
        expect(update).not.toHaveBeenCalled();
    });

    it('nickname が既に使われている場合は UPDATE せず失敗を返す（自分は除外して判定）', async () => {
        const { update, rpc } = buildClient({ nicknameTaken: true });

        const result = await updateProfile(input);

        expect(rpc).toHaveBeenCalledWith('is_nickname_taken', {
            p_nickname: 'たろちゃん',
            p_exclude_user_id: 'user-1',
        });
        expect(result.success).toBe(false);
        expect(update).not.toHaveBeenCalled();
    });

    it('nickname 一意制約違反（競合時 23505）はニックネーム重複の失敗を返す', async () => {
        buildClient({
            updateError: { code: '23505', message: 'violates unique constraint "user_details_nickname_key"' },
        });

        const result = await updateProfile(input);

        expect(result).toEqual({
            success: false,
            error: 'このニックネームは既に使われています。別のニックネームをお試しください',
        });
    });
});
