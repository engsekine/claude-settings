/**
 * 写真添付のバリデーション（枚数 / 容量 / MIME）。クライアント・サーバー共通の純粋関数。
 * 仕様: FR-003 / FR-004（specs/012-photo-attachments）。上限はアップロード原本（変換前）に対する値。
 */

/** 1 ログあたりの添付上限枚数 */
export const MAX_PHOTOS_PER_DIVE = 10;

/** 1 ファイルの容量上限（変換前。10MB） */
export const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

/** 受け付ける MIME（HEIC/HEIF はサーバーで WebP へ変換する） */
export const ALLOWED_PHOTO_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'] as const;

export type AllowedPhotoMime = (typeof ALLOWED_PHOTO_MIME_TYPES)[number];

/** バリデーションの失敗理由。UI 文言は呼び出し側で対応づける */
export type PhotoValidationError =
    | { code: 'too_many'; max: number; attempted: number }
    | { code: 'too_large'; maxBytes: number; fileName: string }
    | { code: 'unsupported_type'; mime: string; fileName: string };

/** 検証対象ファイルの最小情報（File でもサーバー側メタでも渡せる形） */
export interface PhotoFileMeta {
    name: string;
    size: number;
    type: string;
}

export const isAllowedPhotoMime = (mime: string): mime is AllowedPhotoMime =>
    (ALLOWED_PHOTO_MIME_TYPES as readonly string[]).includes(mime);

/**
 * 追加しようとする写真群を検証する。
 * - 既存枚数 + 追加枚数が上限超過なら too_many（先頭で 1 件だけ報告）
 * - 各ファイルの容量・MIME を検証し、全ての違反を列挙して返す
 */
export const validateNewPhotos = (existingCount: number, files: PhotoFileMeta[]): PhotoValidationError[] => {
    const errors: PhotoValidationError[] = [];

    if (existingCount + files.length > MAX_PHOTOS_PER_DIVE) {
        errors.push({ code: 'too_many', max: MAX_PHOTOS_PER_DIVE, attempted: existingCount + files.length });
    }

    for (const file of files) {
        if (!isAllowedPhotoMime(file.type)) {
            errors.push({ code: 'unsupported_type', mime: file.type, fileName: file.name });
            continue;
        }
        if (file.size > MAX_PHOTO_BYTES) {
            errors.push({ code: 'too_large', maxBytes: MAX_PHOTO_BYTES, fileName: file.name });
        }
    }

    return errors;
};

/** 検証エラーを日本語のユーザー向け文言へ変換する */
export const photoValidationMessage = (error: PhotoValidationError): string => {
    switch (error.code) {
        case 'too_many':
            return `写真は 1 ログにつき最大 ${error.max} 枚までです`;
        case 'too_large':
            return `画像は 1 枚あたり最大 ${Math.floor(error.maxBytes / (1024 * 1024))}MB までです（${error.fileName}）`;
        case 'unsupported_type':
            return `対応していない画像形式です（${error.fileName}）`;
    }
};
