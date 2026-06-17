import sharp from 'sharp';

import { DISPLAY_MAX_EDGE, processPhoto, THUMB_MAX_EDGE } from './imageProcessing';

/** 単色の JPEG を生成（任意の幅・高さ・EXIF orientation 付き） */
const makeJpeg = async (width: number, height: number, orientation?: number): Promise<Buffer> => {
    let pipeline = sharp({
        create: { width, height, channels: 3, background: { r: 10, g: 120, b: 200 } },
    });
    if (orientation) pipeline = pipeline.withMetadata({ orientation });
    return pipeline.jpeg().toBuffer();
};

describe('imageProcessing.processPhoto', () => {
    it('表示用・サムネイルとも WebP を出力する（FR-017）', async () => {
        const input = await makeJpeg(800, 600);
        const { display, thumb } = await processPhoto(input);

        expect((await sharp(display).metadata()).format).toBe('webp');
        expect((await sharp(thumb).metadata()).format).toBe('webp');
    });

    it('出力からメタデータ（EXIF/GPS）が除去される（FR-009 / SC-005 / INV-4）', async () => {
        // orientation 付き = EXIF を持つ入力。出力に exif が残らないことを確認
        const input = await makeJpeg(800, 600, 6);
        const { display, thumb } = await processPhoto(input);

        const displayMeta = await sharp(display).metadata();
        const thumbMeta = await sharp(thumb).metadata();
        expect(displayMeta.exif).toBeUndefined();
        expect(thumbMeta.exif).toBeUndefined();
        // orientation も正規化される（タグが残らない）
        expect(displayMeta.orientation).toBeUndefined();
    });

    it('Orientation を適用してピクセルを回転する（FR-016）', async () => {
        // orientation=6（90 度回転）の 800x400 入力 → 回転適用後は 400x800 になる
        const input = await makeJpeg(800, 400, 6);
        const { width, height } = await processPhoto(input);
        expect(width).toBe(400);
        expect(height).toBe(800);
    });

    it('表示用は長辺 2048px・サムネは長辺 480px に収める', async () => {
        const input = await makeJpeg(4000, 3000);
        const { display, thumb } = await processPhoto(input);

        const d = await sharp(display).metadata();
        const t = await sharp(thumb).metadata();
        expect(Math.max(d.width ?? 0, d.height ?? 0)).toBe(DISPLAY_MAX_EDGE);
        expect(Math.max(t.width ?? 0, t.height ?? 0)).toBe(THUMB_MAX_EDGE);
    });

    it('上限より小さい画像は拡大しない（withoutEnlargement）', async () => {
        const input = await makeJpeg(300, 200);
        const { display, width, height } = await processPhoto(input);
        const d = await sharp(display).metadata();
        expect(d.width).toBe(300);
        expect(d.height).toBe(200);
        expect(width).toBe(300);
        expect(height).toBe(200);
    });

    it('壊れた入力は例外を投げる', async () => {
        await expect(processPhoto(Buffer.from('not an image'))).rejects.toThrow();
    });
});
