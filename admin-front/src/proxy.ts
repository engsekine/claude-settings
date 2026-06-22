import { type NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/shared/lib/supabase/middleware';

/** 未認証ユーザー向けのパス（認証済みならダッシュボードへ飛ばす） */
const AUTH_ROUTES = ['/login'];

/**
 * 管理画面の一次ガード（多層防御 / SC-001）。
 *
 * admin-front は専用 Cookie を使い、signInAdmin が非管理者を即サインアウトするため、
 * admin-front のセッションを持つ＝管理者である。よってここでは認証レベルのゲートを行い、
 * 管理者本人かの最終確認は (admin) レイアウトの requireAdmin と RLS で担保する。
 */
export const proxy = async (request: NextRequest) => {
    const { response, user } = await updateSession(request);

    const { pathname } = request.nextUrl;
    const isAuthRoute = AUTH_ROUTES.includes(pathname);

    // 未認証で保護ページにアクセス → ログインへ誘導
    if (!isAuthRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 認証済みでログインページにアクセス → ダッシュボードへ
    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    return response;
};

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
