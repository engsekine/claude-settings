import { type NextRequest, NextResponse } from 'next/server';

import { updateSession } from '@/shared/lib/supabase/middleware';

/** 認証必須のパス（プレフィックス一致）。TOP（`/`）はプレフィックスだと全パスに一致するため完全一致で別判定 */
const APP_ROUTE_PREFIXES = ['/dives', '/dive-sites', '/plans', '/settings'];

/** 未認証ユーザー向けのパス（認証済みなら /dives へ飛ばす） */
const AUTH_ROUTES = ['/login', '/signup', '/reset-password'];

export const proxy = async (request: NextRequest) => {
    const { response, user } = await updateSession(request);

    const { pathname } = request.nextUrl;
    const isAppRoute = pathname === '/' || APP_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    const isAuthRoute = AUTH_ROUTES.includes(pathname);

    // リダイレクト先はリクエスト元と同じオリジンにする。
    // SITE_URL 基準にすると、別ポートで動くサーバー（Playwright の webServer 等）や
    // SITE_URL とホストが異なる環境で別オリジンへ飛ばしてしまう
    if (isAppRoute && !user) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/dives', request.url));
    }

    return response;
};

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
