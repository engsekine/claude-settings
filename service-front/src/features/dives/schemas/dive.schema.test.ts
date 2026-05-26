import { diveSchema, diveSearchSchema } from './dive.schema';

const validBase = {
    diveDate: '2026-01-01',
    location: '伊豆 / 大瀬崎',
    maxDepthM: 18.5,
    bottomTimeMin: 45,
};

describe('diveSchema', () => {
    it('必須項目だけで通過する', async () => {
        await expect(diveSchema.validate(validBase)).resolves.toMatchObject({
            diveDate: '2026-01-01',
            location: '伊豆 / 大瀬崎',
            maxDepthM: 18.5,
            bottomTimeMin: 45,
            certificationDive: false,
        });
    });

    it('location が空だと失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, location: '' })).rejects.toThrow(
            /エリア \/ ポイント名/,
        );
    });

    it('maxDepthM が 0 以下だと失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, maxDepthM: 0 })).rejects.toThrow(/最大水深/);
        await expect(diveSchema.validate({ ...validBase, maxDepthM: -1 })).rejects.toThrow(/最大水深/);
    });

    it('bottomTimeMin が 1 未満だと失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, bottomTimeMin: 0 })).rejects.toThrow(/潜水時間/);
    });

    it('未来日付の diveDate は失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, diveDate: '9999-12-31' })).rejects.toThrow(
            /正しい日付/,
        );
    });

    it('空文字の任意数値フィールドは null に変換される', async () => {
        const result = await diveSchema.validate({
            ...validBase,
            airTempC: '',
            waterTempC: '',
            visibilityM: '',
        });
        expect(result.airTempC).toBeNull();
        expect(result.waterTempC).toBeNull();
        expect(result.visibilityM).toBeNull();
    });

    it('o2Percent が 100 を超えると失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, o2Percent: 101 })).rejects.toThrow(/酸素濃度/);
    });
});

describe('diveSearchSchema', () => {
    it('全て空でも通過する', async () => {
        await expect(diveSearchSchema.validate({})).resolves.toEqual({
            dateFrom: null,
            dateTo: null,
            location: null,
        });
    });

    it('不正な dateFrom は失敗する', async () => {
        await expect(diveSearchSchema.validate({ dateFrom: '2026/01/01' })).rejects.toThrow(/正しい日付/);
    });

    it('location は trim されて null/値が決まる', async () => {
        const result = await diveSearchSchema.validate({ location: '   ' });
        expect(result.location).toBeNull();

        const result2 = await diveSearchSchema.validate({ location: '伊豆' });
        expect(result2.location).toBe('伊豆');
    });
});
