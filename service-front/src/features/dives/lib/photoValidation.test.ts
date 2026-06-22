import {
    isAllowedPhotoMime,
    MAX_PHOTO_BYTES,
    MAX_PHOTOS_PER_DIVE,
    type PhotoFileMeta,
    photoValidationMessage,
    validateNewPhotos,
} from './photoValidation';

const jpeg = (name: string, size = 1000): PhotoFileMeta => ({ name, size, type: 'image/jpeg' });

describe('photoValidation', () => {
    it('上限定数', () => {
        expect(MAX_PHOTOS_PER_DIVE).toBe(10);
        expect(MAX_PHOTO_BYTES).toBe(10 * 1024 * 1024);
    });

    describe('isAllowedPhotoMime', () => {
        it('許可 MIME を判定する', () => {
            expect(isAllowedPhotoMime('image/jpeg')).toBe(true);
            expect(isAllowedPhotoMime('image/heic')).toBe(true);
            expect(isAllowedPhotoMime('video/mp4')).toBe(false);
            expect(isAllowedPhotoMime('application/octet-stream')).toBe(false);
        });
    });

    describe('validateNewPhotos', () => {
        it('上限内・許可形式・容量内はエラーなし', () => {
            expect(validateNewPhotos(0, [jpeg('a.jpg'), jpeg('b.jpg')])).toEqual([]);
        });

        it('既存 + 追加が上限超過で too_many', () => {
            const errors = validateNewPhotos(9, [jpeg('a.jpg'), jpeg('b.jpg')]);
            expect(errors).toContainEqual({ code: 'too_many', max: 10, attempted: 11 });
        });

        it('ちょうど上限はエラーなし（境界値）', () => {
            expect(validateNewPhotos(9, [jpeg('a.jpg')])).toEqual([]);
        });

        it('容量超過で too_large', () => {
            const errors = validateNewPhotos(0, [{ name: 'big.jpg', size: MAX_PHOTO_BYTES + 1, type: 'image/jpeg' }]);
            expect(errors).toContainEqual({ code: 'too_large', maxBytes: MAX_PHOTO_BYTES, fileName: 'big.jpg' });
        });

        it('ちょうど上限容量はエラーなし（境界値）', () => {
            expect(validateNewPhotos(0, [{ name: 'edge.jpg', size: MAX_PHOTO_BYTES, type: 'image/jpeg' }])).toEqual([]);
        });

        it('非対応形式で unsupported_type、容量チェックはスキップ', () => {
            const errors = validateNewPhotos(0, [{ name: 'clip.mp4', size: MAX_PHOTO_BYTES + 1, type: 'video/mp4' }]);
            expect(errors).toEqual([{ code: 'unsupported_type', mime: 'video/mp4', fileName: 'clip.mp4' }]);
        });
    });

    describe('photoValidationMessage', () => {
        it('各エラーを日本語文言に変換する', () => {
            expect(photoValidationMessage({ code: 'too_many', max: 10, attempted: 11 })).toContain('最大 10 枚');
            expect(
                photoValidationMessage({ code: 'too_large', maxBytes: MAX_PHOTO_BYTES, fileName: 'x.jpg' }),
            ).toContain('10MB');
            expect(
                photoValidationMessage({ code: 'unsupported_type', mime: 'video/mp4', fileName: 'x.mp4' }),
            ).toContain('対応していない');
        });
    });
});
