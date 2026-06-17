import sharp from 'sharp';

/**
 * 写真のサーバー側処理（FR-009 / FR-016 / FR-017）。
 * - EXIF の Orientation を適用してピクセルを回転（rotate() 引数なし = 自動回転）
 * - 全メタデータを除去（sharp は既定で出力にメタを引き継がない → GPS も残らない）
 * - 表示用 WebP（長辺 2048px / q80）と サムネイル WebP（長辺 480px / q75）を生成
 * - HEIC / HEIF 入力は libvips(libheif) でデコードして WebP 化（FR-017）
 *
 * 寸法・品質は research.md R1 の確定値。拡大はしない（withoutEnlargement）。
 */

export const DISPLAY_MAX_EDGE = 2048;
export const THUMB_MAX_EDGE = 480;
const DISPLAY_QUALITY = 80;
const THUMB_QUALITY = 75;

export interface ProcessedImage {
    /** 表示用 WebP */
    display: Buffer;
    /** サムネイル WebP */
    thumb: Buffer;
    /** 表示用画像の幅（回転適用後） */
    width: number;
    /** 表示用画像の高さ（回転適用後） */
    height: number;
}

/**
 * 原本バッファを表示用 / サムネイルの WebP に変換する。
 * 入力が壊れている / 非対応の場合は sharp が例外を投げる（呼び出し側で形式エラーに変換）。
 */
export const processPhoto = async (input: Buffer): Promise<ProcessedImage> => {
    // rotate() を引数なしで呼ぶと EXIF Orientation を見てピクセルを回転し、向きタグを正規化する
    const oriented = sharp(input, { failOn: 'error' }).rotate();

    // sharp は既定で入力メタデータを出力へ引き継がない（withMetadata を呼ばない限り）。
    // よって GPS を含む EXIF は出力 WebP に残らない（FR-009 / SC-005）。
    const display = await oriented
        .clone()
        .resize({ width: DISPLAY_MAX_EDGE, height: DISPLAY_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: DISPLAY_QUALITY })
        .toBuffer();

    const thumb = await oriented
        .clone()
        .resize({ width: THUMB_MAX_EDGE, height: THUMB_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
        .webp({ quality: THUMB_QUALITY })
        .toBuffer();

    const meta = await sharp(display).metadata();

    return { display, thumb, width: meta.width ?? 0, height: meta.height ?? 0 };
};
