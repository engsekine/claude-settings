import Link from 'next/link';

import { COPYRIGHT_HOLDER } from '@/shared/constants/site';

const FOOTER_LINKS = [
    { href: '/', label: 'ホーム' },
    { href: '/chat', label: 'チャット' },
    { href: '/terms', label: '利用規約' },
    { href: '/privacy-policy', label: 'プライバシーポリシー' },
] as const;

export const Footer = () => {
    return (
        <footer className="border-t border-border bg-background">
            <div className="mx-auto max-w-5xl px-4 py-6">
                <nav aria-label="フッターナビゲーション">
                    <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                        {FOOTER_LINKS.map((link) => (
                            <li key={link.href}>
                                <Link
                                    href={link.href}
                                    className="text-sm text-muted-foreground hover:text-foreground"
                                >
                                    {link.label}
                                </Link>
                            </li>
                        ))}
                    </ul>
                </nav>
                <p className="mt-4 text-center text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} {COPYRIGHT_HOLDER}. All rights reserved.
                </p>
            </div>
        </footer>
    );
};
