import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';

import { SITE_NAME } from '@/shared/constants/site';

import './globals.css';
import { Providers } from './providers';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

const geistMono = Geist_Mono({
    variable: '--font-geist-mono',
    subsets: ['latin'],
});

export const metadata: Metadata = {
    title: {
        template: `%s | ${SITE_NAME}`,
        default: SITE_NAME,
    },
    description: `${SITE_NAME} - AIチャットサービス`,
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col">
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
