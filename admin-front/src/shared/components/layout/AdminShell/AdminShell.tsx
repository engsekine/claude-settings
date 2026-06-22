import { Button } from '@repo/ui/components/button';
import type { ReactNode } from 'react';

import { signOutAdmin } from '@/features/admin-auth/server/actions';

import { AdminSidebar } from './AdminSidebar';

interface AdminShellProps {
    /** ヘッダーに表示する管理者名 */
    displayName: string;
    children: ReactNode;
}

/**
 * WordPress 管理画面に倣った 3 ペインのシェル（FR-019）。
 * 上部ヘッダー（ログイン者・ログアウト）+ 左サイドバー + メイン領域。
 */
export const AdminShell = ({ displayName, children }: AdminShellProps) => (
    <div className="flex min-h-dvh flex-col">
        <header className="flex items-center justify-between border-b bg-background px-4 py-3">
            <span className="font-semibold">ダイビングログ運営管理</span>
            <div className="flex items-center gap-3">
                <span className="text-muted-foreground text-sm">{displayName}</span>
                <form action={signOutAdmin}>
                    <Button type="submit" variant="outline" size="sm">
                        ログアウト
                    </Button>
                </form>
            </div>
        </header>
        <div className="flex flex-1">
            <aside className="w-56 shrink-0 border-r bg-background">
                <AdminSidebar />
            </aside>
            <main className="flex-1 p-6">{children}</main>
        </div>
    </div>
);
