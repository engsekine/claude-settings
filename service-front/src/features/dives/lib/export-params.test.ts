import { EXPORT_MAX_IDS, parseExportParams } from './export-params';

const params = (init: Record<string, string>) => new URLSearchParams(init);
const uuid = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`;

describe('parseExportParams', () => {
    it('format=csv をフィルタ経路として受理する（ids なし）', () => {
        const result = parseExportParams(params({ format: 'csv' }));
        expect(result).toEqual({ ok: true, format: 'csv', ids: null, filter: {} });
    });

    it('format=pdf を受理する', () => {
        const result = parseExportParams(params({ format: 'pdf' }));
        expect(result.ok && result.format).toBe('pdf');
    });

    it('format 欠落はエラー', () => {
        expect(parseExportParams(params({})).ok).toBe(false);
    });

    it('format 不正はエラー', () => {
        expect(parseExportParams(params({ format: 'xlsx' })).ok).toBe(false);
    });

    it('013 のフィルタ（期間・タイプ）を引き継ぐ', () => {
        const result = parseExportParams(params({ format: 'csv', date_from: '2025-01-01', type: 'boat' }));
        expect(result.ok && result.filter).toEqual({ dateFrom: '2025-01-01', diveType: 'boat' });
    });

    it('ids を解析しフィルタより優先扱いで返す', () => {
        const result = parseExportParams(params({ format: 'pdf', ids: `${uuid(1)},${uuid(2)}` }));
        expect(result.ok && result.ids).toEqual([uuid(1), uuid(2)]);
    });

    it('ids 内の空白・空要素を除去する', () => {
        const result = parseExportParams(params({ format: 'csv', ids: ` ${uuid(1)} , ,${uuid(2)}` }));
        expect(result.ok && result.ids).toEqual([uuid(1), uuid(2)]);
    });

    it('ids が空文字ならフィルタ経路（ids=null）', () => {
        const result = parseExportParams(params({ format: 'csv', ids: '' }));
        expect(result.ok && result.ids).toBeNull();
    });

    it('ids に不正な UUID が混じるとエラー', () => {
        const result = parseExportParams(params({ format: 'csv', ids: `${uuid(1)},not-a-uuid` }));
        expect(result.ok).toBe(false);
    });

    it(`ids が ${EXPORT_MAX_IDS} 件超でエラー`, () => {
        const tooMany = Array.from({ length: EXPORT_MAX_IDS + 1 }, (_, i) => uuid(i)).join(',');
        const result = parseExportParams(params({ format: 'csv', ids: tooMany }));
        expect(result.ok).toBe(false);
    });
});
