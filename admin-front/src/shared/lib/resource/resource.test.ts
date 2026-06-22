import { describe, expect, it, vi } from 'vitest';

import { DEFAULT_PER_PAGE, parsePage, parseSearch, parseSort } from './params';
import { listResource } from './queries';

describe('parsePage', () => {
    it('正の整数はそのまま返す', () => {
        expect(parsePage('3')).toBe(3);
    });
    it('不正値・未指定は 1 にフォールバックする', () => {
        expect(parsePage(undefined)).toBe(1);
        expect(parsePage('0')).toBe(1);
        expect(parsePage('-2')).toBe(1);
        expect(parsePage('abc')).toBe(1);
    });
});

describe('parseSearch', () => {
    it('空文字・空白のみは undefined にする', () => {
        expect(parseSearch('  ')).toBeUndefined();
        expect(parseSearch(undefined)).toBeUndefined();
    });
    it('前後の空白を除去して返す', () => {
        expect(parseSearch('  伊豆 ')).toBe('伊豆');
    });
});

describe('parseSort', () => {
    const sortable = ['created_at', 'name'] as const;
    it('許可カラムのみ受理し、dir=desc で降順にする', () => {
        expect(parseSort('name', 'desc', sortable)).toEqual({ column: 'name', ascending: false });
        expect(parseSort('name', 'asc', sortable)).toEqual({ column: 'name', ascending: true });
    });
    it('許可リスト外のカラムは undefined（injection 防止）', () => {
        expect(parseSort('password', 'asc', sortable)).toBeUndefined();
    });
});

/** range() で解決するチェーン可能なクエリビルダーのモックを作る */
const createQueryMock = (result: { data: unknown[]; count: number }) => {
    const calls: Record<string, unknown[]> = { is: [], or: [], order: [], range: [], select: [], from: [] };
    const builder: Record<string, ReturnType<typeof vi.fn>> = {};
    for (const method of ['is', 'or', 'order'] as const) {
        builder[method] = vi.fn((...args: unknown[]) => {
            calls[method]?.push(args);
            return builder;
        });
    }
    builder['range'] = vi.fn((...args: unknown[]) => {
        calls['range']?.push(args);
        return Promise.resolve({ data: result.data, error: null, count: result.count });
    });
    const supabase = {
        from: vi.fn((table: string) => {
            calls['from']?.push([table]);
            return {
                select: vi.fn((columns: string, opts: unknown) => {
                    calls['select']?.push([columns, opts]);
                    return builder;
                }),
            };
        }),
    };
    return { supabase, builder, calls };
};

describe('listResource', () => {
    it('page/perPage から range を計算し、件数を返す', async () => {
        const { supabase, calls } = createQueryMock({ data: [{ id: 'a' }], count: 42 });
        // biome-ignore lint/suspicious/noExplicitAny: テスト用モック
        const result = await listResource(supabase as any, 'dive_sites', 'id', {
            page: 3,
            perPage: DEFAULT_PER_PAGE,
        });
        expect(calls['range']).toEqual([[40, 59]]);
        expect(result).toEqual({ rows: [{ id: 'a' }], total: 42, page: 3, perPage: 20 });
    });

    it('hasDeletedAt かつ includeDeleted=false なら deleted_at is null を適用', async () => {
        const { supabase, builder } = createQueryMock({ data: [], count: 0 });
        // biome-ignore lint/suspicious/noExplicitAny: テスト用モック
        await listResource(supabase as any, 'dives', 'id', {
            page: 1,
            perPage: 20,
            hasDeletedAt: true,
        });
        expect(builder['is']).toHaveBeenCalledWith('deleted_at', null);
    });

    it('検索語があれば searchColumns で or(ilike) を適用', async () => {
        const { supabase, builder } = createQueryMock({ data: [], count: 0 });
        // biome-ignore lint/suspicious/noExplicitAny: テスト用モック
        await listResource(supabase as any, 'dive_sites', 'id,name', {
            page: 1,
            perPage: 20,
            search: '伊豆',
            searchColumns: ['name', 'area'],
        });
        expect(builder['or']).toHaveBeenCalledWith('name.ilike.%伊豆%,area.ilike.%伊豆%');
    });

    it('検索語の PostgREST 特殊文字（,()%_）を除去してフィルタ構文の破壊を防ぐ', async () => {
        const { supabase, builder } = createQueryMock({ data: [], count: 0 });
        // biome-ignore lint/suspicious/noExplicitAny: テスト用モック
        await listResource(supabase as any, 'dive_sites', 'id,name', {
            page: 1,
            perPage: 20,
            search: 'a%,name.eq.x)',
            searchColumns: ['name'],
        });
        // 特殊文字が空白化され、フィルタ注入が無効化されている
        expect(builder['or']).toHaveBeenCalledWith('name.ilike.%a  name.eq.x%');
    });

    it('並び替えは許可リストにあるカラムのみ適用する', async () => {
        const { supabase, builder } = createQueryMock({ data: [], count: 0 });
        // biome-ignore lint/suspicious/noExplicitAny: テスト用モック
        await listResource(supabase as any, 'dive_sites', 'id', {
            page: 1,
            perPage: 20,
            sort: { column: 'evil', ascending: true },
            sortableColumns: ['name'],
        });
        expect(builder['order']).not.toHaveBeenCalled();
    });

    it('0 件でも rows=[] / total=0 を返す（FR-009）', async () => {
        const { supabase } = createQueryMock({ data: [], count: 0 });
        // biome-ignore lint/suspicious/noExplicitAny: テスト用モック
        const result = await listResource(supabase as any, 'dives', 'id', { page: 1, perPage: 20 });
        expect(result.rows).toEqual([]);
        expect(result.total).toBe(0);
    });
});
