import Image from 'next/image';
import Link from 'next/link';
import type { ReactNode } from 'react';

import { SITE_NAME } from '@/shared/constants/site';

interface HeaderProps {
    actions?: ReactNode;
}

export const Header = ({ actions }: HeaderProps) => {
    return (
        <header className="border-border border-b bg-background">
            <div className="flex h-14 items-center justify-between px-4">
                <Link href="/" className="flex items-center" aria-label={SITE_NAME}>
                    <Image src="/logo.png" alt={SITE_NAME} width={80} height={40} priority className="h-10 w-auto" />
                </Link>
                <div className="flex items-center gap-6">
                    <nav aria-label="メインナビゲーション">
                        <ul className="flex items-center gap-6">
                            <li>
                                <Link
                                    href="/"
                                    className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                >
                                    ホーム
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/about"
                                    className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                >
                                    概要
                                </Link>
                            </li>
                            <li>
                                <Link
                                    href="/dives"
                                    className="text-muted-foreground text-sm transition-colors hover:text-foreground"
                                >
                                    ダイビングログ
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
