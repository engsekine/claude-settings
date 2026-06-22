import {
    buildDisplayPath,
    buildDivePrefix,
    buildOrigPath,
    buildPhotoPath,
    buildThumbPath,
    DIVE_PHOTOS_BUCKET,
    extFromMime,
    PROCESSED_PHOTO_EXT,
    parsePhotoPath,
} from './photoStorage';

const USER = '11111111-1111-1111-1111-111111111111';
const DIVE = '22222222-2222-2222-2222-222222222222';
const PHOTO = '33333333-3333-3333-3333-333333333333';

describe('photoStorage', () => {
    it('バケット名は dive-photos', () => {
        expect(DIVE_PHOTOS_BUCKET).toBe('dive-photos');
    });

    describe('extFromMime', () => {
        it('許可 MIME を拡張子に変換する', () => {
            expect(extFromMime('image/jpeg')).toBe('jpg');
            expect(extFromMime('image/png')).toBe('png');
            expect(extFromMime('image/webp')).toBe('webp');
            expect(extFromMime('image/heic')).toBe('heic');
            expect(extFromMime('image/heif')).toBe('heif');
        });

        it('未知の MIME は bin', () => {
            expect(extFromMime('application/pdf')).toBe('bin');
        });
    });

    describe('buildPhotoPath / 各種パス', () => {
        it('{user_id}/{dive_id}/{kind}/{photo_id}.{ext} 形式', () => {
            expect(buildPhotoPath({ userId: USER, diveId: DIVE, kind: 'orig', photoId: PHOTO, ext: 'jpg' })).toBe(
                `${USER}/${DIVE}/orig/${PHOTO}.jpg`,
            );
        });

        it('display / thumb は WebP 固定', () => {
            expect(PROCESSED_PHOTO_EXT).toBe('webp');
            expect(buildDisplayPath(USER, DIVE, PHOTO)).toBe(`${USER}/${DIVE}/display/${PHOTO}.webp`);
            expect(buildThumbPath(USER, DIVE, PHOTO)).toBe(`${USER}/${DIVE}/thumb/${PHOTO}.webp`);
        });

        it('orig は原本拡張子を保持する', () => {
            expect(buildOrigPath(USER, DIVE, PHOTO, 'image/heic')).toBe(`${USER}/${DIVE}/orig/${PHOTO}.heic`);
        });

        it('ログ配下プレフィックスは末尾スラッシュ付き', () => {
            expect(buildDivePrefix(USER, DIVE)).toBe(`${USER}/${DIVE}/`);
        });
    });

    describe('parsePhotoPath', () => {
        it('階層を分解する', () => {
            expect(parsePhotoPath(`${USER}/${DIVE}/display/${PHOTO}.webp`)).toEqual({
                userId: USER,
                diveId: DIVE,
                kind: 'display',
                file: `${PHOTO}.webp`,
            });
        });

        it('階層不足は null', () => {
            expect(parsePhotoPath('only/two')).toBeNull();
        });
    });
});
