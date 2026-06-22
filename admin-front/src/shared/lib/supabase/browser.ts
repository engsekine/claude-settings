import { ADMIN_AUTH_COOKIE_NAME } from '@repo/supabase/constants';
import { createClient as createBaseClient } from '@repo/supabase/browser';

/**
 * 管理画面（Client Component）用の Supabase クライアント。
 * admin 専用 Cookie 名を注入し、利用者セッションと分離する（FR-005）。
 */
export const createClient = () => createBaseClient(ADMIN_AUTH_COOKIE_NAME);
