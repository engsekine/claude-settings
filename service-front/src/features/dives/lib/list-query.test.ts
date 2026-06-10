import type { Database } from '@repo/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';
import { vi } from 'vitest';

import { DIVE_PAGE_SIZE } from '@/features/dives/constants';

import { DIVE_LIST_COLUMNS, fetchDiveListPage, mapDiveListItem } from './list-query';

const buildRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'd1',
    dive_number: 1,
    dive_date: '2026-06-01',
    location: '伊豆 / 大瀬崎',
    max_depth_m: 18.5,
    bottom_time_min: 45,
    water_temp_c: 22.5,
    visibility_m: 15,
    certification_dive: false,
    ...overrides,
});

interface QueryResult {
    data: unknown[] | null;
    error: { message: string } | null;
}

/** チェーン可能かつ await 可能（thenable）な Supabase クエリビルダーのモック */
const createMockClient = (result: QueryResult) => {
    const builder = {
        select: vi.fn(),
        order: vi.fn(),
        limit: vi.fn(),
        eq: vi.fn(),
        ilike: vi.fn(),
        or: vi.fn(),
        // biome-ignore lint/suspicious/noThenProperty: Supabase クエリビルダーは thenable のため、モックでも then を実装する必要がある
        then: (resolve: (value: QueryResult) => void) => resolve(result),
    };
    for (const method of ['select', 'order', 'limit', 'eq', 'ilike', 'or'] as const) {
        builder[method].mockReturnValue(builder);
    }
    const from = vi.fn(() => builder);
    return { client: { from } as unknown as SupabaseClient<Database>, from, builder };
};

describe('mapDiveListItem', () => {
    it('snake_case の行を camelCase に変換する', () => {
        expect(mapDiveListItem(buildRow() as Parameters<typeof mapDiveListItem>[0])).toEqual({
            id: 'd1',
            diveNumber: 1,
            diveDate: '2026-06-01',
            location: '伊豆 / 大瀬崎',
            maxDepthM: 18.5,
            bottomTimeMin: 45,
            waterTempC: 22.5,
            visibilityM: 15,
            certificationDive: false,
        });
    });

    it('numeric カラムが string で返っても数値に正規化する', () => {
        const row = buildRow({ max_depth_m: '18.5', water_temp_c: '22.5', visibility_m: null });
        const item = mapDiveListItem(row as Parameters<typeof mapDiveListItem>[0]);

        expect(item.maxDepthM).toBe(18.5);
        expect(item.waterTempC).toBe(22.5);
        expect(item.visibilityM).toBeNull();
    });
});

describe('fetchDiveListPage', () => {
    it('dives から一覧列を日付・id 降順で limit + 1 件取得する', async () => {
        const { client, from, builder } = createMockClient({ data: [buildRow()], error: null });

        const page = await fetchDiveListPage(client);

        expect(from).toHaveBeenCalledWith('dives');
        expect(builder.select).toHaveBeenCalledWith(DIVE_LIST_COLUMNS);
        expect(builder.order).toHaveBeenNthCalledWith(1, 'dive_date', { ascending: false });
        expect(builder.order).toHaveBeenNthCalledWith(2, 'id', { ascending: false });
        expect(builder.limit).toHaveBeenCalledWith(DIVE_PAGE_SIZE + 1);
        expect(page.items).toHaveLength(1);
        expect(page.nextCursor).toBeNull();
    });

    it('filter の各条件をクエリに反映する', async () => {
        const { client, builder } = createMockClient({ data: [], error: null });

        await fetchDiveListPage(client, {
            filter: { diveNumber: 42, diveDate: '2026-06-01', location: '伊豆' },
        });

        expect(builder.eq).toHaveBeenCalledWith('dive_number', 42);
        expect(builder.eq).toHaveBeenCalledWith('dive_date', '2026-06-01');
        expect(builder.ilike).toHaveBeenCalledWith('location', '%伊豆%');
        expect(builder.or).not.toHaveBeenCalled();
    });

    it('cursor 指定時は (dive_date, id) の複合カーソル条件を付与する', async () => {
        const { client, builder } = createMockClient({ data: [], error: null });

        await fetchDiveListPage(client, { cursor: { diveDate: '2026-06-01', id: 'd9' } });

        expect(builder.or).toHaveBeenCalledWith('dive_date.lt.2026-06-01,and(dive_date.eq.2026-06-01,id.lt.d9)');
    });

    it('limit を超える行が返ったら limit 件に切り詰めて nextCursor を返す', async () => {
        const rows = [
            buildRow({ id: 'd3', dive_date: '2026-06-03' }),
            buildRow({ id: 'd2', dive_date: '2026-06-02' }),
            buildRow({ id: 'd1', dive_date: '2026-06-01' }),
        ];
        const { client } = createMockClient({ data: rows, error: null });

        const page = await fetchDiveListPage(client, { limit: 2 });

        expect(page.items.map((item) => item.id)).toEqual(['d3', 'd2']);
        expect(page.nextCursor).toEqual({ diveDate: '2026-06-02', id: 'd2' });
    });

    it('行数が limit 以下なら nextCursor は null', async () => {
        const { client } = createMockClient({ data: [buildRow()], error: null });

        const page = await fetchDiveListPage(client, { limit: 2 });

        expect(page.items).toHaveLength(1);
        expect(page.nextCursor).toBeNull();
    });

    it('Supabase エラー時は throw する', async () => {
        const { client } = createMockClient({ data: null, error: { message: 'permission denied' } });

        await expect(fetchDiveListPage(client)).rejects.toThrow(/permission denied/);
    });
});
