import { ADMIN_AUTH_COOKIE_NAME } from '@repo/supabase/constants';
import { updateSession as baseUpdateSession } from '@repo/supabase/middleware';
import type { NextRequest } from 'next/server';

/**
 * 管理画面（middleware / proxy）用のセッション更新。
 * admin 専用 Cookie 名を注入し、利用者セッションと分離する（FR-005）。
 */
export const updateSession = (request: NextRequest) => baseUpdateSession(request, ADMIN_AUTH_COOKIE_NAME);
