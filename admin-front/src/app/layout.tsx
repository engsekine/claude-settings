import { Geist } from 'next/font/google';

import { SITE_METADATA } from '@/shared/config/metadata';

import './globals.css';

const geistSans = Geist({
    variable: '--font-geist-sans',
    subsets: ['latin'],
});

export const metadata = SITE_METADATA;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja" className={`${geistSans.variable} h-full antialiased`}>
            <body className="min-h-full bg-background text-foreground">{children}</body>
        </html>
    );
}
