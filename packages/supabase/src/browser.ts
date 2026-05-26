import { createBrowserClient } from '@supabase/ssr';

import type { Database } from './types';

/** ブラウザ（Client Component）用の Supabase クライアント */
export const createClient = () => {
    const url = process.env['NEXT_PUBLIC_SUPABASE_URL'];
    const anonKey = process.env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

    if (!url) {
        throw new Error('環境変数 NEXT_PUBLIC_SUPABASE_URL が設定されていません');
    }
    if (!anonKey) {
        throw new Error('環境変数 NEXT_PUBLIC_SUPABASE_ANON_KEY が設定されていません');
    }

    return createBrowserClient<Database>(url, anonKey);
};
