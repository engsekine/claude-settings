import type { Database } from '@repo/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

vi.mock('sharp', () => ({
    default: () => ({ png: () => ({ toBuffer: async () => Buffer.from([137, 80, 78, 71]) }) }),
}));

import { fetchExportThumbnails } from './export-thumbs';

type PhotoRow = { dive_id: string; thumb_path: string; is_cover: boolean; sort_order: number };

const makeClient = (rows: PhotoRow[], download: (path: string) => { data: unknown; error: unknown }) => {
    const queryBuilder = {
        select: vi.fn().mockReturnThis(),
        in: vi.fn().mockReturnThis(),
        // biome-ignore lint/suspicious/noThenProperty: Supabase クエリビルダーは thenable のためモックでも then を実装する
        then: (resolve: (v: { data: PhotoRow[]; error: null }) => void) => resolve({ data: rows, error: null }),
    };
    const download_ = vi.fn(async (path: string) => download(path));
    const client = {
        from: vi.fn(() => queryBuilder),
        storage: { from: vi.fn(() => ({ download: download_ })) },
    } as unknown as SupabaseClient<Database>;
    return { client, download: download_ };
};

const blobOf = (bytes: number[]) => ({ arrayBuffer: async () => new Uint8Array(bytes).buffer });

describe('fetchExportThumbnails', () => {
    it('diveIds が空なら問い合わせず空マップ', async () => {
        const { client } = makeClient([], () => ({ data: null, error: null }));
        const result = await fetchExportThumbnails(client, []);
        expect(result.size).toBe(0);
    });

    it('cover 優先で取得し PNG bytes に変換してマップに格納する', async () => {
        const { client, download } = makeClient(
            [
                { dive_id: 'd1', thumb_path: 'a.webp', is_cover: false, sort_order: 1 },
                { dive_id: 'd1', thumb_path: 'cover.webp', is_cover: true, sort_order: 9 },
            ],
            () => ({ data: blobOf([1, 2, 3]), error: null }),
        );

        const result = await fetchExportThumbnails(client, ['d1']);

        expect(download).toHaveBeenNthCalledWith(1, 'cover.webp'); // cover 先頭
        expect(result.get('d1')).toHaveLength(2);
        expect(result.get('d1')?.[0]).toBeInstanceOf(Uint8Array);
    });

    it('ダウンロード失敗の画像はスキップする', async () => {
        const { client } = makeClient(
            [{ dive_id: 'd1', thumb_path: 'broken.webp', is_cover: true, sort_order: 0 }],
            () => ({ data: null, error: { message: 'not found' } }),
        );

        const result = await fetchExportThumbnails(client, ['d1']);
        expect(result.has('d1')).toBe(false);
    });
});
