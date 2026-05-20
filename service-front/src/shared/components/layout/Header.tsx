import Link from 'next/link';
import type { ReactNode } from 'react';

import { SITE_NAME } from '@/shared/constants/site';

interface HeaderProps {
    actions?: ReactNode;
}

export const Header = ({ actions }: HeaderProps) => {
    return (
        <header className="border-border border-b bg-background">
            <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
                <Link href="/" className="font-semibold text-foreground text-lg">
                    {SITE_NAME}
                </Link>
                <div className="flex items-center gap-6">
                    <nav aria-label="メインナビゲーション">
                        <ul className="flex items-center gap-6">
                            <li>
                                <Link
                                    href="/"
                                    className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                >
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/about"
                                    className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                >
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
