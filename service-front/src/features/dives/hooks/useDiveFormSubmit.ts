'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import type { DiveFormValues } from '@/features/dives/schemas/dive.schema';
import { createDive, updateDive } from '@/features/dives/server/actions';

interface UseDiveFormSubmitResult {
    isPending: boolean;
    serverError: string | null;
    /** react-hook-form の handleSubmit に渡すサブミットハンドラ */
    submit: (values: DiveFormValues) => void;
}

/**
 * DiveForm の送信処理を担うフック。
 * diveId が渡されたら更新（updateDive）、無ければ新規作成（createDive）として動作する。
 * 成功時は詳細ページへ遷移し router.refresh() でサーバーコンポーネント側のキャッシュを破棄する。
 */
export const useDiveFormSubmit = (diveId?: string): UseDiveFormSubmitResult => {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);

    const isEdit = diveId !== undefined;

    const submit = (values: DiveFormValues): void => {
        setServerError(null);
        startTransition(async () => {
            if (isEdit) {
                const result = await updateDive(diveId, values);
                if (!result.success) {
                    setServerError(result.error);
                    return;
                }
                router.push(`/dives/${diveId}`);
                router.refresh();
                return;
            }

            const result = await createDive(values);
            if (!result.success) {
                setServerError(result.error);
                return;
            }
            router.push(`/dives/${result.id}`);
            router.refresh();
        });
    };

    return { isPending, serverError, submit };
};
