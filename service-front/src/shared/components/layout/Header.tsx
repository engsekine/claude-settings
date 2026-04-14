import type { ReactNode } from 'react';

import Link from 'next/link';

import { SITE_NAME } from '@/shared/constants/site';

interface HeaderProps {
    actions?: ReactNode;
}

export const Header = ({ actions }: HeaderProps) => {
    return (
        <header className="border-b border-border bg-background">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
                <Link href="/" className="text-lg font-semibold text-foreground">
                    {SITE_NAME}
                </Link>
                <div className="flex items-center gap-6">
                    <nav aria-label="メインナビゲーション">
                        <ul className="flex items-center gap-6">
                            <li>
                                <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link href="/about" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                                    About
                                </Link>
                            </li>
                        </ul>
                    </nav>
                    {actions}
                </div>
            </div>
        </header>
    );
};
