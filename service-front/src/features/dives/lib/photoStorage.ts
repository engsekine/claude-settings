/**
 * dive_photos の Storage パス生成と種別判定（純粋関数）。
 * バケット・パス規約は specs/012-photo-attachments/contracts/storage-layout.md に従う。
 * パス: {user_id}/{dive_id}/{kind}/{photo_id}.{ext}
 */

/** 写真を保存する Storage バケット名 */
export const DIVE_PHOTOS_BUCKET = 'dive-photos';

/** Storage 上の種別。orig=原本（処理後削除）/ display=表示用 / thumb=サムネイル */
export type PhotoKind = 'orig' | 'display' | 'thumb';

/** display / thumb は常に WebP で保存する */
export const PROCESSED_PHOTO_EXT = 'webp';

/** MIME から原本の拡張子を導出する。未知の MIME は 'bin'（呼び出し側で検証済み前提） */
const MIME_TO_EXT: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
    'image/heic': 'heic',
    'image/heif': 'heif',
};

/** 許可 MIME の原本拡張子を返す。未知なら 'bin' */
export const extFromMime = (mime: string): string => MIME_TO_EXT[mime] ?? 'bin';

/** 写真 1 枚のオブジェクトパスを生成する */
export const buildPhotoPath = (params: {
    userId: string;
    diveId: string;
    kind: PhotoKind;
    photoId: string;
    ext: string;
}): string => {
    const { userId, diveId, kind, photoId, ext } = params;
    return `${userId}/${diveId}/${kind}/${photoId}.${ext}`;
};

/** display 用パス（WebP 固定） */
export const buildDisplayPath = (userId: string, diveId: string, photoId: string): string =>
    buildPhotoPath({ userId, diveId, kind: 'display', photoId, ext: PROCESSED_PHOTO_EXT });

/** thumb 用パス（WebP 固定） */
export const buildThumbPath = (userId: string, diveId: string, photoId: string): string =>
    buildPhotoPath({ userId, diveId, kind: 'thumb', photoId, ext: PROCESSED_PHOTO_EXT });

/** orig 用パス（原本の拡張子を保持） */
export const buildOrigPath = (userId: string, diveId: string, photoId: string, mime: string): string =>
    buildPhotoPath({ userId, diveId, kind: 'orig', photoId, ext: extFromMime(mime) });

/** あるダイブログ配下の全オブジェクトのプレフィックス（ログ削除時の一括削除に使う） */
export const buildDivePrefix = (userId: string, diveId: string): string => `${userId}/${diveId}/`;

/** パスから階層（[user_id, dive_id, kind, file]）を取り出す。Storage RLS と同じ分解 */
export const parsePhotoPath = (name: string): { userId: string; diveId: string; kind: string; file: string } | null => {
    const segments = name.split('/');
    if (segments.length < 4) return null;
    const [userId, diveId, kind, ...rest] = segments;
    if (!userId || !diveId || !kind) return null;
    return { userId, diveId, kind, file: rest.join('/') };
};
