'use client';

import { Button } from '@repo/ui/components/button';
import { useEffect, useRef, useState, useTransition } from 'react';

import { deleteDive } from '@/features/dives/server/actions';

interface DeleteDiveButtonProps {
    diveId: string;
}

export const DeleteDiveButton = ({ diveId }: DeleteDiveButtonProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [error, setError] = useState<string | null>(null);
    const cancelButtonRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        if (!isOpen) return;
        cancelButtonRef.current?.focus();

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsOpen(false);
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);

    const handleDelete = () => {
        setError(null);
        startTransition(async () => {
            const result = await deleteDive(diveId);
            if (!result.success) {
                setError(result.error);
            }
        });
    };

    return (
        <>
            <Button variant="destructive" onClick={() => setIsOpen(true)}>
                削除
            </Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="delete-dive-title"
                        aria-describedby="delete-dive-description"
                        className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-background p-6 shadow-lg"
                    >
                        <h2 id="delete-dive-title" className="font-semibold text-lg">
                            ログを削除しますか？
                        </h2>
                        <p id="delete-dive-description" className="text-muted-foreground text-sm">
                            削除すると元に戻せません。本当に削除してよろしいですか？
                        </p>

                        {error && (
                            <p role="alert" className="text-red-600 text-sm">
                                {error}
                            </p>
                        )}

                        <div className="flex items-center justify-end gap-2">
                            <Button
                                ref={cancelButtonRef}
                                type="button"
                                variant="outline"
                                onClick={() => setIsOpen(false)}
                                disabled={isPending}
                            >
                                キャンセル
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={isPending}
                                aria-busy={isPending}
                            >
                                {isPending ? '削除中...' : '削除する'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
