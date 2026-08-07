import type { User } from '@supabase/supabase-js';

import { actionFailure } from '@/shared/types/action-result';

/** requireUser が必要とする最小の Supabase クライアント形（テスト・型結合を最小化） */
interface AuthClient {
    auth: {
        getUser(): Promise<{ data: { user: User | null } }>;
    };
}

type RequireUserResult = { user: User; failure: null } | { user: null; failure: { success: false; error: string } };

/**
 * Server Action の認証ガード。未ログインなら ActionResult 互換の失敗を返す。
 *
 * 使い方（failure が判別子になり、ガード後は user が非 null に絞られる）:
 * ```ts
 * const { user, failure } = await requireUser(supabase);
 * if (failure) return failure;
 * ```
 */
export const requireUser = async (supabase: AuthClient): Promise<RequireUserResult> => {
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { user: null, failure: actionFailure('ログインが必要です') };
    return { user, failure: null };
};
