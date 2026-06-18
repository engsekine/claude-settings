import type { Dive } from '@/features/dives/types';

import { buildPdfData, type ExportPhotoRef, selectThumbnailPaths } from './build-pdf-data';

const photo = (over: Partial<ExportPhotoRef>): ExportPhotoRef => ({
    thumbPath: 't.webp',
    isCover: false,
    sortOrder: 0,
    ...over,
});

describe('selectThumbnailPaths', () => {
    it('cover を先頭、続いて sortOrder 昇順で並べる', () => {
        const result = selectThumbnailPaths([
            photo({ thumbPath: 'b', sortOrder: 2 }),
            photo({ thumbPath: 'cover', isCover: true, sortOrder: 5 }),
            photo({ thumbPath: 'a', sortOrder: 1 }),
        ]);
        expect(result).toEqual(['cover', 'a', 'b']);
    });

    it('最大枚数で打ち切る', () => {
        const photos = Array.from({ length: 10 }, (_, i) => photo({ thumbPath: `t${i}`, sortOrder: i }));
        expect(selectThumbnailPaths(photos, 4)).toHaveLength(4);
    });

    it('写真が無ければ空配列', () => {
        expect(selectThumbnailPaths([])).toEqual([]);
    });
});

describe('buildPdfData', () => {
    const dive = (over: Partial<Dive> = {}): Dive =>
        ({ id: 'd1', location: '大瀬崎', diveSite: null, ...over }) as Dive;

    it('表示名を解決し、対応するサムネイルを載せる', () => {
        const thumbs = new Map<string, Uint8Array[]>([['d1', [new Uint8Array([1])]]]);
        const [entry] = buildPdfData([dive()], thumbs);
        expect(entry?.locationLabel).toBe('大瀬崎');
        expect(entry?.thumbnails).toHaveLength(1);
    });

    it('サイト参照ログはエリア込みで解決する', () => {
        const [entry] = buildPdfData(
            [dive({ location: null, diveSite: { id: 's', name: '大瀬崎', area: '伊豆' } })],
            new Map(),
        );
        expect(entry?.locationLabel).toBe('伊豆 / 大瀬崎');
    });

    it('サムネイルが無いダイブは空配列', () => {
        const [entry] = buildPdfData([dive()], new Map());
        expect(entry?.thumbnails).toEqual([]);
    });
});
