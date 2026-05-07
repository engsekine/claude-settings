import type { NextConfig } from 'next';

const nextConfig = {
    reactStrictMode: true,
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
    images: {
        formats: ['image/avif', 'image/webp'],
        // 外部画像を使う場合はdomainsを追加
        // remotePatterns: [
        //   {
        //     protocol: 'https',
        //     hostname: 'example.com',
        //   },
        // ],
    },

    // セキュリティヘッダー
    headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on',
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN',
                    },
                    {
                        key: 'X-Content-Type-Options',
                        value: 'nosniff',
                    },
                    {
                        key: 'Referrer-Policy',
                        value: 'origin-when-cross-origin',
                    },
                    {
                        key: 'Content-Security-Policy',
                        value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' https: data:; font-src 'self' https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'",
                    },
                ],
            },
        ];
    },

    transpilePackages: ['@repo/supabase'],

    experimental: {
        typedRoutes: true,
    },
} as NextConfig;

export default nextConfig;
