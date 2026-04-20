import { Geist, Geist_Mono } from 'next/font/google';

import { AuthNav } from '@/features/auth';
import { Footer } from '@/shared/components/layout/Footer';
import { Header } from '@/shared/components/layout/Header';
import { SITE_METADATA } from '@/shared/config/metadata';

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

export const metadata = SITE_METADATA;

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="ja" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
            <body className="min-h-full flex flex-col">
                <Providers>
                    <Header actions={<AuthNav />} />
                    <main className="flex flex-1 bg-background">{children}</main>
                    <Footer />
                </Providers>
            </body>
        </html>
    );
}
