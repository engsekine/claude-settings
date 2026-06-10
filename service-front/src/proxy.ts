import { type NextRequest, NextResponse } from 'next/server';

import { SITE_URL } from '@/shared/constants/site';
import { updateSession } from '@/shared/lib/supabase/middleware';

/** 認証必須のパス（プレフィックス一致） */
const APP_ROUTE_PREFIXES = ['/dives', '/settings'];

/** 未認証ユーザー向けのパス（認証済みなら /dives へ飛ばす） */
const AUTH_ROUTES = ['/login', '/signup', '/reset-password'];

export const proxy = async (request: NextRequest) => {
    const { response, user } = await updateSession(request);

    const { pathname } = request.nextUrl;
    const isAppRoute = APP_ROUTE_PREFIXES.some((prefix) => pathname.startsWith(prefix));
    const isAuthRoute = AUTH_ROUTES.includes(pathname);

    if (isAppRoute && !user) {
        return NextResponse.redirect(new URL('/login', SITE_URL));
    }

    if (isAuthRoute && user) {
        return NextResponse.redirect(new URL('/dives', SITE_URL));
    }

    return response;
};

export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
