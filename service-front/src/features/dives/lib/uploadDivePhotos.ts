import { addDivePhoto } from '@/features/dives/server/photoActions';
import { createClient } from '@/shared/lib/supabase/browser';

import { buildOrigPath, DIVE_PHOTOS_BUCKET } from './photoStorage';

export interface UploadDivePhotosResult {
    /** 追加に成功した枚数 */
    added: number;
    /** 失敗したファイルのメッセージ（部分失敗。FR-015） */
    errors: string[];
}

/**
 * 複数の原本ファイルを Storage に直アップロードし、各々を Server Action で登録する（クライアント用）。
 * 1 枚ごとに独立して処理し、失敗したものだけ errors に積む（他は成功扱い）。
 * パスの user_id はアップロード者本人と一致させる必要がある（Storage RLS / addDivePhoto の検証）。
 */
export const uploadDivePhotos = async (
    diveId: string,
    userId: string,
    files: File[],
): Promise<UploadDivePhotosResult> => {
    const supabase = createClient();
    const errors: string[] = [];
    let added = 0;

    for (const file of files) {
        const photoId = crypto.randomUUID();
        const origPath = buildOrigPath(userId, diveId, photoId, file.type);

        const { error: uploadError } = await supabase.storage
            .from(DIVE_PHOTOS_BUCKET)
            .upload(origPath, file, { contentType: file.type, upsert: true });
        if (uploadError) {
            errors.push(`${file.name}: アップロードに失敗しました`);
            continue;
        }

        const result = await addDivePhoto({ diveId, origPath });
        if (!result.success) {
            errors.push(`${file.name}: ${result.error}`);
            continue;
        }
        added += 1;
    }

    return { added, errors };
};
