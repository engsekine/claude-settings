import { beforeEach, describe, expect, it, vi } from 'vitest';

const createClient = vi.fn();
const redirect = vi.fn((url: string) => {
    /** 本物の redirect は throw して以降を中断するため、テストでも同様に振る舞わせる */
    throw new Error(`NEXT_REDIRECT:${url}`);
});

vi.mock('next/navigation', () => ({
    redirect: (url: string) => redirect(url),
}));

vi.mock('@/shared/lib/supabase/server', () => ({
    createClient: (...args: unknown[]) => createClient(...args),
}));

import { CURRENT_TERMS_VERSION } from '@/shared/constants/terms';

import { type CompleteProfileInput, completeProfile, type SignUpInput, signInWithGoogle, signUp } from './actions';

interface MockOptions {
    /** signInWithOAuth の戻り */
    oauth?: { data: { url: string | null }; error: { message: string } | null };
    /** getUser の戻り。null は未ログイン */
    user?: { id: string } | null;
    /** user_details への insert の戻り error */
    insertError?: { code?: string; message: string } | null;
}

const buildSupabaseMock = (options: MockOptions = {}) => {
    const {
        oauth = { data: { url: 'https://accounts.google.com/o/oauth2/auth' }, error: null },
        user = { id: 'user-1' },
        insertError = null,
    } = options;

    const signInWithOAuth = vi.fn().mockResolvedValue(oauth);
    const getUser = vi.fn().mockResolvedValue({ data: { user } });
    const insert = vi.fn().mockResolvedValue({ error: insertError });
    const supabaseSignUp = vi
        .fn()
        .mockResolvedValue({ data: { user: { id: 'user-1', identities: [{ id: 'i1' }] } }, error: null });

    return {
        client: {
            auth: { signInWithOAuth, getUser, signUp: supabaseSignUp },
            from: vi.fn().mockReturnValue({ insert }),
        },
        signInWithOAuth,
        insert,
        supabaseSignUp,
    };
};

const signUpInput: SignUpInput = {
    email: 'user@example.com',
    password: 'Password1234',
    lastName: '山田',
    firstName: '太郎',
    lastNameRomaji: 'Yamada',
    firstNameRomaji: 'Taro',
    nickname: 'たろちゃん',
    birthOn: '1990-01-01',
    gender: 'male',
    heightCm: null,
    weightKg: null,
    agreedToTerms: true,
};

const profileInput: CompleteProfileInput = {
    lastName: '山田',
    firstName: '太郎',
    lastNameRomaji: 'Yamada',
    firstNameRomaji: 'Taro',
    nickname: 'たろちゃん',
    birthOn: '1990-01-01',
    gender: 'male',
    heightCm: null,
    weightKg: null,
    agreedToTerms: true,
};

beforeEach(() => {
    createClient.mockReset();
    redirect.mockClear();
});

describe('signInWithGoogle', () => {
    it('OAuth URL が得られたら Google 同意画面へ redirect する', async () => {
        const mock = buildSupabaseMock();
        createClient.mockResolvedValue(mock.client);

        await expect(signInWithGoogle()).rejects.toThrow('NEXT_REDIRECT:https://accounts.google.com/o/oauth2/auth');

        expect(mock.signInWithOAuth).toHaveBeenCalledWith(
            expect.objectContaining({
                provider: 'google',
                options: expect.objectContaining({
                    redirectTo: expect.stringContaining('/api/auth/callback?next=/dives'),
                }),
            }),
        );
    });

    it('URL が無い / error の場合は失敗を返す（redirect しない）', async () => {
        createClient.mockResolvedValue(
            buildSupabaseMock({ oauth: { data: { url: null }, error: { message: 'boom' } } }).client,
        );

        const result = await signInWithGoogle();

        expect(result.success).toBe(false);
        expect(redirect).not.toHaveBeenCalled();
    });

    it('authorize URL の内部ホスト（host.docker.internal）をブラウザ可達なホストへ差し替える', async () => {
        vi.stubEnv('SUPABASE_INTERNAL_URL', 'http://host.docker.internal:54321');
        vi.stubEnv('NEXT_PUBLIC_SUPABASE_URL', 'http://127.0.0.1:54321');
        createClient.mockResolvedValue(
            buildSupabaseMock({
                oauth: {
                    data: { url: 'http://host.docker.internal:54321/auth/v1/authorize?provider=google' },
                    error: null,
                },
            }).client,
        );

        await expect(signInWithGoogle()).rejects.toThrow(
            'NEXT_REDIRECT:http://127.0.0.1:54321/auth/v1/authorize?provider=google',
        );

        vi.unstubAllEnvs();
    });
});

describe('completeProfile', () => {
    it('未ログインなら失敗を返す', async () => {
        createClient.mockResolvedValue(buildSupabaseMock({ user: null }).client);

        const result = await completeProfile(profileInput);

        expect(result.success).toBe(false);
    });

    it('INSERT 成功で /dives へ redirect する', async () => {
        const mock = buildSupabaseMock();
        createClient.mockResolvedValue(mock.client);

        await expect(completeProfile(profileInput)).rejects.toThrow('NEXT_REDIRECT:/dives');
        expect(mock.insert).toHaveBeenCalledWith(
            expect.objectContaining({ user_id: 'user-1', nickname: 'たろちゃん' }),
        );
    });

    it('PK 重複（補完済み再送）は冪等に /dives へ redirect する', async () => {
        createClient.mockResolvedValue(
            buildSupabaseMock({ insertError: { code: '23505', message: 'duplicate' } }).client,
        );

        await expect(completeProfile(profileInput)).rejects.toThrow('NEXT_REDIRECT:/dives');
    });

    it('その他の INSERT エラーは失敗を返す', async () => {
        createClient.mockResolvedValue(buildSupabaseMock({ insertError: { code: 'XXXXX', message: 'boom' } }).client);

        const result = await completeProfile(profileInput);

        expect(result.success).toBe(false);
    });

    it('利用規約未同意なら Supabase に到達せず失敗を返す（018 / FR-008）', async () => {
        const result = await completeProfile({ ...profileInput, agreedToTerms: false });

        expect(result.success).toBe(false);
        expect(createClient).not.toHaveBeenCalled();
    });
});

describe('signUp - 利用規約同意（018）', () => {
    it('未同意なら Supabase に到達せず失敗を返す（FR-008）', async () => {
        const result = await signUp({ ...signUpInput, agreedToTerms: false });

        expect(result.success).toBe(false);
        expect(createClient).not.toHaveBeenCalled();
    });

    it('同意済みなら options.data に terms_version を含めて signUp する', async () => {
        const mock = buildSupabaseMock();
        createClient.mockResolvedValue(mock.client);

        await signUp(signUpInput);

        expect(mock.supabaseSignUp).toHaveBeenCalledWith(
            expect.objectContaining({
                options: expect.objectContaining({
                    data: expect.objectContaining({ terms_version: CURRENT_TERMS_VERSION }),
                }),
            }),
        );
    });
});
