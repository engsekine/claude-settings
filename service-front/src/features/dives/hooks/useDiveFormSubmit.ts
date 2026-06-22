'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { uploadDivePhotos } from '@/features/dives/lib/uploadDivePhotos';
import type { DiveFormValues } from '@/features/dives/schemas/dive.schema';
import { createDive, updateDive } from '@/features/dives/server/actions';
import { deleteDivePhoto } from '@/features/dives/server/photoActions';
import { createClient } from '@/shared/lib/supabase/browser';

interface UseDiveFormSubmitResult {
    isPending: boolean;
    serverError: string | null;
    /**
     * react-hook-form の handleSubmit に渡すサブミットハンドラ。
     * - 新規作成時: photos に File[] を渡すと、ログ保存 → dive_id 確定 → アップロードの順で同時添付する。
     * - 編集時: photoIdsToDelete に削除予定の写真 ID を渡すと、更新成功後にまとめて削除する（保存時削除）。
     */
    submit: (values: DiveFormValues, photos?: File[], photoIdsToDelete?: string[]) => void;
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

    const submit = (values: DiveFormValues, photos?: File[], photoIdsToDelete?: string[]): void => {
        setServerError(null);
        startTransition(async () => {
            if (isEdit) {
                const result = await updateDive(diveId, values);
                if (!result.success) {
                    setServerError(result.error);
                    return;
                }
                // 保存時に「削除予定」とマークされた写真をまとめて削除する（FR-013）。
                // 部分失敗はログ更新を巻き戻さない（FR-015）。
                if (photoIdsToDelete && photoIdsToDelete.length > 0) {
                    await Promise.all(photoIdsToDelete.map((photoId) => deleteDivePhoto(photoId)));
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

            // ログ保存後に dive_id が確定するので、その配下へ写真をアップロードする（FR-001 AC2）。
            // 写真の部分失敗はログ作成自体を巻き戻さない（FR-015）— 詳細ページで成功分を確認できる。
            if (photos && photos.length > 0) {
                const {
                    data: { user },
                } = await createClient().auth.getUser();
                if (user) await uploadDivePhotos(result.id, user.id, photos);
            }

            router.push(`/dives/${result.id}`);
            router.refresh();
        });
    };

    return { isPending, serverError, submit };
};
