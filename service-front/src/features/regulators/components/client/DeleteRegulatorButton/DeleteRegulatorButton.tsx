'use client';

import { Button } from '@repo/ui/components/button';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

import { deleteRegulator } from '@/features/regulators/server/actions';

interface DeleteRegulatorButtonProps {
    regulatorId: string;
    /** 確認ダイアログに表示する機材名（例: ブランド + モデル名） */
    name: string;
}

export const DeleteRegulatorButton = ({ regulatorId, name }: DeleteRegulatorButtonProps) => {
    const router = useRouter();
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
            const result = await deleteRegulator(regulatorId);
            if (!result.success) {
                setError(result.error);
                return;
            }
            // 機材一覧ページ内で使うため遷移は不要。再フェッチのみ行う
            setIsOpen(false);
            router.refresh();
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
                        aria-labelledby="delete-regulator-title"
                        aria-describedby="delete-regulator-description"
                        className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-background p-6 shadow-lg"
                    >
                        <h2 id="delete-regulator-title" className="font-semibold text-lg">
                            {name} を削除しますか？
                        </h2>
                        <p id="delete-regulator-description" className="text-muted-foreground text-sm">
                            削除するとオーバーホール履歴も含めて元に戻せません。本当に削除してよろしいですか？
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
