import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

import type { Database } from './types';

/** Middleware 用の Supabase クライアント（セッション更新） */
export const updateSession = async (request: NextRequest) => {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient<Database>(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
        {
            cookies: {
                getAll: () => request.cookies.getAll(),
                setAll: (cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) => {
                    for (const { name, value } of cookiesToSet) {
                        request.cookies.set(name, value);
                    }
                    supabaseResponse = NextResponse.next({ request });
                    for (const { name, value, options } of cookiesToSet) {
                        supabaseResponse.cookies.set(name, value, options);
                    }
                },
            },
        },
    );

    /** セッションを更新（期限切れトークンのリフレッシュ） */
    await supabase.auth.getUser();

    return supabaseResponse;
};
