import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import type { Database } from './types';

/** Server Component / Route Handler 用の Supabase クライアント */
export const createClient = async () => {
    const cookieStore = await cookies();

    return createServerClient<Database>(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
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
