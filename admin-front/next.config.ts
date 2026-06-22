import type { NextConfig } from 'next';

/**
 * admin-front の Next.js 設定。
 * Supabase へブラウザから接続するため connect-src に Supabase の origin を許可する。
 * 管理画面は検索エンジンに載せないため、X-Robots-Tag で noindex を付与する。
 */
const supabaseUrl = process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? '';
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : '';
const supabaseWsOrigin = supabaseOrigin.replace(/^http/, 'ws');
const connectSrc = ["'self'", supabaseOrigin, supabaseWsOrigin].filter(Boolean).join(' ');

const nextConfig = {
    distDir: process.env['NEXT_DIST_DIR'] ?? '.next',
    reactStrictMode: true,
    // 管理画面は動的ルート（一覧→詳細・検索クエリ）が多いため typedRoutes は無効化する
    typedRoutes: false,
    typescript: {
        ignoreBuildErrors: false,
    },
    headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    { key: 'X-Frame-Options', value: 'DENY' },
                    { key: 'X-Content-Type-Options', value: 'nosniff' },
                    { key: 'Referrer-Policy', value: 'no-referrer' },
                    // 管理画面はインデックスさせない
                    { key: 'X-Robots-Tag', value: 'noindex, nofollow' },
                    {
                        key: 'Content-Security-Policy',
                        value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data: blob: ${supabaseOrigin}; font-src 'self'; connect-src ${connectSrc}; frame-ancestors 'none'`,
                    },
                ],
            },
        ];
    },
    transpilePackages: ['@repo/supabase', '@repo/ui'],
} as NextConfig;

export default nextConfig;
