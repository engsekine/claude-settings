import type { Database } from '@repo/supabase';

import type { DivePhoto, DivePhotoView } from '@/features/dives/types';

type DivePhotoRow = Database['public']['Tables']['dive_photos']['Row'];

/** DB 行（snake_case）をドメイン型へ変換する純粋関数 */
export const mapDivePhotoRow = (row: DivePhotoRow): DivePhoto => ({
    id: row.id,
    diveId: row.dive_id,
    displayPath: row.display_path,
    thumbPath: row.thumb_path,
    caption: row.caption,
    sortOrder: row.sort_order,
    isCover: row.is_cover,
    width: row.width,
    height: row.height,
});

/** alt はキャプション優先、無ければログ情報由来のフォールバック（FR-009 系 / accessibility.md） */
export const buildPhotoAlt = (caption: string, fallback: string): string => {
    const trimmed = caption.trim();
    return trimmed.length > 0 ? trimmed : fallback;
};

/** 署名 URL を解決して表示用 View に変換する。URL 解決に失敗した写真は null（除外用） */
export const toDivePhotoView = (
    photo: DivePhoto,
    signedUrlByPath: Map<string, string>,
    altFallback: string,
): DivePhotoView | null => {
    const displayUrl = signedUrlByPath.get(photo.displayPath);
    const thumbUrl = signedUrlByPath.get(photo.thumbPath);
    if (!displayUrl || !thumbUrl) return null;
    return {
        id: photo.id,
        displayUrl,
        thumbUrl,
        caption: photo.caption,
        isCover: photo.isCover,
        width: photo.width,
        height: photo.height,
        alt: buildPhotoAlt(photo.caption, altFallback),
    };
};
