import { filterToSearchParams, isSameFilter, parseDiveFilter, recordToSearchParams } from './search-params';

describe('parseDiveFilter', () => {
    it('各パラメータを正しくパースする', () => {
        const params = new URLSearchParams(
            'number=12&date_from=2025-07-01&date_to=2025-08-31&depth_min=18&depth_max=40&type=boat&q=伊豆',
        );
        expect(parseDiveFilter(params)).toEqual({
            diveNumber: 12,
            dateFrom: '2025-07-01',
            dateTo: '2025-08-31',
            depthMin: 18,
            depthMax: 40,
            diveType: 'boat',
            location: '伊豆',
        });
    });

    it('空の URL は空フィルタ', () => {
        expect(parseDiveFilter(new URLSearchParams())).toEqual({});
    });

    it('不正な日付は無視する', () => {
        expect(parseDiveFilter(new URLSearchParams('date_from=2025/07/01&date_to=invalid'))).toEqual({});
    });

    it('範囲外の深度・番号は無視する', () => {
        expect(parseDiveFilter(new URLSearchParams('depth_min=-1&depth_max=999&number=-5'))).toEqual({});
    });

    it('列挙外の type は無視する', () => {
        expect(parseDiveFilter(new URLSearchParams('type=unknown'))).toEqual({});
    });

    it('未知のパラメータは無視する', () => {
        expect(parseDiveFilter(new URLSearchParams('foo=bar'))).toEqual({});
    });

    it('空白のみの q は無視する', () => {
        expect(parseDiveFilter(new URLSearchParams('q=%20%20'))).toEqual({});
    });

    it('depth_min=0 は有効値として扱う', () => {
        expect(parseDiveFilter(new URLSearchParams('depth_min=0'))).toEqual({ depthMin: 0 });
    });
});

describe('filterToSearchParams', () => {
    it('空フィルタは空文字列', () => {
        expect(filterToSearchParams({}).toString()).toBe('');
    });

    it('指定値のみ出力し、空値は省略する', () => {
        const params = filterToSearchParams({
            diveNumber: 12,
            dateFrom: '2025-07-01',
            depthMin: 18,
            diveType: 'boat',
            location: '伊豆',
        });
        expect(params.get('number')).toBe('12');
        expect(params.get('date_from')).toBe('2025-07-01');
        expect(params.get('depth_min')).toBe('18');
        expect(params.get('type')).toBe('boat');
        expect(params.get('q')).toBe('伊豆');
        expect(params.has('date_to')).toBe(false);
        expect(params.has('depth_max')).toBe(false);
    });

    it('depthMin が 0 でも出力する', () => {
        expect(filterToSearchParams({ depthMin: 0 }).get('depth_min')).toBe('0');
    });
});

describe('round-trip', () => {
    it('filter → params → filter で一致する', () => {
        const filter = {
            diveNumber: 3,
            dateFrom: '2025-07-01',
            dateTo: '2025-08-31',
            depthMin: 10,
            depthMax: 30,
            diveType: 'deep',
            location: '大瀬崎',
        };
        expect(parseDiveFilter(filterToSearchParams(filter))).toEqual(filter);
    });
});

describe('recordToSearchParams', () => {
    it('Record を URLSearchParams に変換し、配列は先頭を採用する', () => {
        const params = recordToSearchParams({ number: '5', type: ['boat', 'beach'], empty: undefined });
        expect(params.get('number')).toBe('5');
        expect(params.get('type')).toBe('boat');
        expect(params.has('empty')).toBe(false);
    });
});

describe('isSameFilter', () => {
    it('同一条件で true', () => {
        expect(isSameFilter({ diveNumber: 1, dateFrom: '2025-07-01' }, { diveNumber: 1, dateFrom: '2025-07-01' })).toBe(
            true,
        );
        expect(isSameFilter({}, {})).toBe(true);
    });

    it('差異があると false', () => {
        expect(isSameFilter({ diveNumber: 1 }, { diveNumber: 2 })).toBe(false);
        expect(isSameFilter({}, { location: '伊豆' })).toBe(false);
    });
});
