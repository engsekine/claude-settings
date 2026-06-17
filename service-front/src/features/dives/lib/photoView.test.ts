import { buildPhotoAlt, mapDivePhotoRow, toDivePhotoView } from './photoView';

const row = (over: Record<string, unknown> = {}) => ({
    id: 'p1',
    dive_id: 'd1',
    user_id: 'u1',
    display_path: 'u1/d1/display/p1.webp',
    thumb_path: 'u1/d1/thumb/p1.webp',
    caption: '',
    sort_order: 0,
    is_cover: true,
    width: 2048,
    height: 1536,
    created_at: '2026-06-16T00:00:00Z',
    updated_at: '2026-06-16T00:00:00Z',
    ...over,
});

describe('mapDivePhotoRow', () => {
    it('snake_case 行を camelCase に変換する', () => {
        expect(mapDivePhotoRow(row())).toEqual({
            id: 'p1',
            diveId: 'd1',
            displayPath: 'u1/d1/display/p1.webp',
            thumbPath: 'u1/d1/thumb/p1.webp',
            caption: '',
            sortOrder: 0,
            isCover: true,
            width: 2048,
            height: 1536,
        });
    });
});

describe('buildPhotoAlt', () => {
    it('キャプションがあれば優先する', () => {
        expect(buildPhotoAlt('沖縄の珊瑚', '2026-06-16 のダイブ')).toBe('沖縄の珊瑚');
    });
    it('空・空白のみならフォールバック', () => {
        expect(buildPhotoAlt('', '2026-06-16 のダイブ')).toBe('2026-06-16 のダイブ');
        expect(buildPhotoAlt('   ', 'fallback')).toBe('fallback');
    });
});

describe('toDivePhotoView', () => {
    const photo = mapDivePhotoRow(row({ caption: '海' }));

    it('display/thumb の署名 URL を解決して View を返す', () => {
        const urls = new Map([
            ['u1/d1/display/p1.webp', 'https://signed/display'],
            ['u1/d1/thumb/p1.webp', 'https://signed/thumb'],
        ]);
        expect(toDivePhotoView(photo, urls, 'fb')).toEqual({
            id: 'p1',
            displayUrl: 'https://signed/display',
            thumbUrl: 'https://signed/thumb',
            caption: '海',
            isCover: true,
            width: 2048,
            height: 1536,
            alt: '海',
        });
    });

    it('URL 解決に失敗した写真は null', () => {
        expect(toDivePhotoView(photo, new Map(), 'fb')).toBeNull();
    });
});
