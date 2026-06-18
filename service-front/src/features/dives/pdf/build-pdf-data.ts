// PDF 描画用データの組み立て（純粋関数）。I/O を持たないため単体テスト対象。
import { diveLocationLabel } from '@/features/dives/lib/diveLabel';
import type { Dive } from '@/features/dives/types';

/** 1 ログ欄に載せるサムネイルの最大枚数（PDF サイズ・生成時間を抑える） */
export const MAX_THUMBNAILS_PER_DIVE = 4;

/** サムネイル選定に必要な写真の最小情報 */
export interface ExportPhotoRef {
    thumbPath: string;
    isCover: boolean;
    sortOrder: number;
}

/**
 * PDF に載せるサムネイルを選定する。
 * 代表写真（is_cover）を先頭、続いて sort_order 昇順で最大 max 件の thumb_path を返す。
 */
export const selectThumbnailPaths = (photos: ExportPhotoRef[], max: number = MAX_THUMBNAILS_PER_DIVE): string[] =>
    [...photos]
        .sort((a, b) => {
            if (a.isCover !== b.isCover) return a.isCover ? -1 : 1;
            return a.sortOrder - b.sortOrder;
        })
        .slice(0, max)
        .map((photo) => photo.thumbPath);

/** PDF の 1 ログ欄に対応する描画データ */
export interface DivePdfEntry {
    dive: Dive;
    /** 解決済みの表示ポイント名 */
    locationLabel: string;
    /** 埋め込み済みサムネイル（PNG バイト）。未添付・取得失敗時は空配列 */
    thumbnails: Uint8Array[];
}

/**
 * Dive[] と diveId → サムネイルバイト配列から PDF 描画データを組み立てる。
 * サムネイルが無いダイブは空配列（PDF 側で空欄として扱う）。
 */
export const buildPdfData = (dives: Dive[], thumbnailsByDiveId: Map<string, Uint8Array[]>): DivePdfEntry[] =>
    dives.map((dive) => ({
        dive,
        locationLabel: diveLocationLabel({ location: dive.location, diveSite: dive.diveSite }),
        thumbnails: thumbnailsByDiveId.get(dive.id) ?? [],
    }));
