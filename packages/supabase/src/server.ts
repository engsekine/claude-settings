import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from './types';

/**
 * Server Component / Route Handler 用の Supabase クライアント
 *
 * Docker コンテナ内から接続する場合、ブラウザ側で使う `NEXT_PUBLIC_SUPABASE_URL`
 * （`http://localhost:54321` 等）はコンテナ内では解決できない。コンテナ内専用 URL
 * （`http://host.docker.internal:54321` 等）を `SUPABASE_INTERNAL_URL` に設定し、
 * サーバー側ではそちらを優先する。
 */
export const createClient = async () => {
    const cookieStore = await cookies();

    return createServerClient<Database>(
        process.env['SUPABASE_INTERNAL_URL'] ?? process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
        {
            cookies: {
                getAll: () => cookieStore.getAll(),
                setAll: (cookiesToSet: { name: string; value: string; options: Record<string, unknown> }[]) => {
                    for (const { name, value, options } of cookiesToSet) {
                        cookieStore.set(name, value, options);
                    }
                },
            },
        },
    );
};
