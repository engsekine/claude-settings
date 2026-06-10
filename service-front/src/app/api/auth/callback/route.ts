import { type NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/shared/lib/supabase/server';

/**
 * Supabase Auth のメール認証 / OAuth コールバック
 * リセットメール内のリンクや確認メールから遷移する
 */
export const GET = async (request: NextRequest) => {
    const { searchParams, origin } = request.nextUrl;
    const code = searchParams.get('code');
    const next = searchParams.get('next') ?? '/dives';

    if (!code) {
        return NextResponse.redirect(`${origin}/login`);
    }

    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
        return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
    }

    return NextResponse.redirect(`${origin}${next}`);
};
