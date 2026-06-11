'use client';

import { Button } from '@repo/ui/components/button';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition } from 'react';

interface RecordOverhaulButtonProps {
    regulatorId: string;
    /**
     * メンテ完了を記録する Server Action。
     * dashboard → regulators の feature 間直接 import を避けるため、
     * ページ側で regulators feature の recordOverhaul を渡す。
     */
    onRecord: (regulatorId: string) => Promise<{ success: true } | { success: false; error: string }>;
}

export const RecordOverhaulButton = ({ regulatorId, onRecord }: RecordOverhaulButtonProps) => {
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

    const handleRecord = () => {
        setError(null);
        startTransition(async () => {
            const result = await onRecord(regulatorId);
            if (!result.success) {
                setError(result.error);
                return;
            }
            setIsOpen(false);
            router.refresh();
        });
    };

    return (
        <>
            <Button onClick={() => setIsOpen(true)}>メンテ完了を記録</Button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="record-overhaul-title"
                        aria-describedby="record-overhaul-description"
                        className="flex w-full max-w-md flex-col gap-4 rounded-lg bg-background p-6 shadow-lg"
                    >
                        <h2 id="record-overhaul-title" className="font-semibold text-lg">
                            メンテ完了を記録しますか？
                        </h2>
                        <p id="record-overhaul-description" className="text-muted-foreground text-sm">
                            前回 OH 日を今日に更新します。よろしいですか？
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
                            <Button type="button" onClick={handleRecord} disabled={isPending} aria-busy={isPending}>
                                {isPending ? '記録中...' : '記録する'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
