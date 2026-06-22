// 対象ログの写真サムネイル（WebP）を取得し、PDF 埋め込み用に PNG bytes へ変換する。
// supabase を引数で受け取り I/O を局所化（route から使う）。@react-pdf は WebP 非対応のため PNG 化が必須。
import type { Database } from '@repo/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import sharp from 'sharp';

import { DIVE_PHOTOS_BUCKET } from '@/features/dives/lib/photoStorage';
import { type ExportPhotoRef, selectThumbnailPaths } from '@/features/dives/pdf/build-pdf-data';

/** WebP バイト列を PDF 埋め込み可能な PNG bytes に変換する。失敗時は null（その画像はスキップ） */
const toPngBytes = async (webp: ArrayBuffer): Promise<Uint8Array | null> => {
    try {
        const png = await sharp(Buffer.from(webp)).png().toBuffer();
        return new Uint8Array(png);
    } catch {
        return null;
    }
};

/**
 * 指定したダイブ群のサムネイルを取得して diveId → PNG bytes[] のマップを返す。
 * 1 ログあたり cover 優先で最大 4 枚（build-pdf-data の選定ロジックを共用）。
 * 写真メタ取得失敗・個別ダウンロード/変換失敗は致命的とせず、その分を除いて続行する（PDF は画像なしで成立）。
 */
export const fetchExportThumbnails = async (
    supabase: SupabaseClient<Database>,
    diveIds: string[],
): Promise<Map<string, Uint8Array[]>> => {
    const result = new Map<string, Uint8Array[]>();
    if (diveIds.length === 0) return result;

    const { data, error } = await supabase
        .from('dive_photos')
        .select('dive_id, thumb_path, is_cover, sort_order')
        .in('dive_id', diveIds);
    if (error || !data) {
        // 写真メタ取得失敗は致命的とせず画像なしで続行するが、運用把握のためログは残す
        if (error) console.error('[export-thumbs] dive_photos の取得に失敗しました', error);
        return result;
    }

    const refsByDive = new Map<string, ExportPhotoRef[]>();
    for (const row of data as Array<{ dive_id: string; thumb_path: string; is_cover: boolean; sort_order: number }>) {
        const refs = refsByDive.get(row.dive_id) ?? [];
        refs.push({ thumbPath: row.thumb_path, isCover: row.is_cover, sortOrder: row.sort_order });
        refsByDive.set(row.dive_id, refs);
    }

    await Promise.all(
        [...refsByDive.entries()].map(async ([diveId, refs]) => {
            const images = await Promise.all(
                selectThumbnailPaths(refs).map(async (thumbPath) => {
                    const { data: blob, error: downloadError } = await supabase.storage
                        .from(DIVE_PHOTOS_BUCKET)
                        .download(thumbPath);
                    if (downloadError || !blob) return null;
                    return toPngBytes(await blob.arrayBuffer());
                }),
            );
            const valid = images.filter((bytes): bytes is Uint8Array => bytes !== null);
            if (valid.length > 0) result.set(diveId, valid);
        }),
    );

    return result;
};
