import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/shared/lib/supabase/server';

/**
 * 非管理者セッションの破棄用エンドポイント（requireAdmin の失敗時遷移先）。
 * 「認証済みだが admin_users に行がない」セッションを残すと
 * /login ↔ / の無限リダイレクトになるため、ここで signOut してからログインへ返す。
 * （Server Component のレンダリング中は Cookie を変更できないため Route Handler で行う）
 */
export const GET = async (request: NextRequest) => {
    const supabase = await createClient();
    await supabase.auth.signOut();

    return NextResponse.redirect(new URL('/login', request.url));
};
