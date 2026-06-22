'use client';

import { Button } from '@repo/ui/components/button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { softDeleteDiveSite } from '@/features/dive-sites-admin/server/actions';
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog';

interface DiveSiteRowActionsProps {
    id: string;
    name: string;
}

/** 一覧行の編集リンク + 削除（ソフトデリート、確認付き / SC-006）。失敗時は inline alert で通知（FR-020） */
export const DiveSiteRowActions = ({ id, name }: DiveSiteRowActionsProps) => {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPending, startTransition] = useTransition();

    const onConfirm = () => {
        startTransition(async () => {
            const result = await softDeleteDiveSite(id);
            if (!result.success) {
                setError(result.error);
                setOpen(false);
                return;
            }
            setOpen(false);
            router.refresh();
        });
    };

    return (
        <div className="flex items-center gap-3">
            <Link href={`/dive-sites/${id}/edit`} className="text-primary text-sm underline hover:no-underline">
                編集
            </Link>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                    setError(null);
                    setOpen(true);
                }}
            >
                削除
            </Button>
            {error && (
                <span role="alert" className="text-red-600 text-xs">
                    {error}
                </span>
            )}
            <ConfirmDialog
                open={open}
                onOpenChange={setOpen}
                title="ダイブサイトを削除"
                description={`「${name}」を削除します。この操作は後で復元できます。よろしいですか？`}
                confirmLabel="削除する"
                destructive
                isPending={isPending}
                onConfirm={onConfirm}
            />
        </div>
    );
};
