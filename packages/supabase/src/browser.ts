import { createBrowserClient } from '@supabase/ssr';

import type { Database } from './types';

/** ブラウザ（Client Component）用の Supabase クライアント */
export const createClient = () =>
    createBrowserClient<Database>(
        process.env['NEXT_PUBLIC_SUPABASE_URL']!,
        process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY']!,
    );
