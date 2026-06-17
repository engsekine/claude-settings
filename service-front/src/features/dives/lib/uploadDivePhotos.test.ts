import { beforeEach, describe, expect, it, vi } from 'vitest';

const upload = vi.fn();
const addDivePhoto = vi.fn();

vi.mock('@/shared/lib/supabase/browser', () => ({
    createClient: () => ({ storage: { from: () => ({ upload }) } }),
}));
vi.mock('@/features/dives/server/photoActions', () => ({
    addDivePhoto: (...args: unknown[]) => addDivePhoto(...args),
}));

import { uploadDivePhotos } from './uploadDivePhotos';

const file = (name: string) => new File(['x'], name, { type: 'image/jpeg' });

describe('uploadDivePhotos', () => {
    beforeEach(() => {
        upload.mockReset().mockResolvedValue({ error: null });
        addDivePhoto.mockReset().mockResolvedValue({ success: true, photoId: 'p1' });
    });

    it('全件成功で added を返す', async () => {
        const result = await uploadDivePhotos('d1', 'u1', [file('a.jpg'), file('b.jpg')]);
        expect(result).toEqual({ added: 2, errors: [] });
        expect(upload).toHaveBeenCalledTimes(2);
        expect(addDivePhoto).toHaveBeenCalledTimes(2);
    });

    it('本人 / dive 配下のパスにアップロードする', async () => {
        await uploadDivePhotos('d1', 'u1', [file('a.jpg')]);
        const path = upload.mock.calls[0]?.[0] as string;
        expect(path.startsWith('u1/d1/orig/')).toBe(true);
    });

    it('アップロード失敗は errors に積み addDivePhoto を呼ばない', async () => {
        upload.mockResolvedValueOnce({ error: { message: 'boom' } });
        const result = await uploadDivePhotos('d1', 'u1', [file('a.jpg')]);
        expect(result.added).toBe(0);
        expect(result.errors).toHaveLength(1);
        expect(addDivePhoto).not.toHaveBeenCalled();
    });

    it('登録失敗（addDivePhoto）は errors に積む（部分失敗 FR-015）', async () => {
        addDivePhoto
            .mockResolvedValueOnce({ success: true, photoId: 'p1' })
            .mockResolvedValueOnce({ success: false, error: '上限です' });
        const result = await uploadDivePhotos('d1', 'u1', [file('a.jpg'), file('b.jpg')]);
        expect(result.added).toBe(1);
        expect(result.errors).toEqual(['b.jpg: 上限です']);
    });
});
