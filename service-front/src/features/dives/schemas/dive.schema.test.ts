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

    it('location が空でサイトも未選択だと失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, location: '' })).rejects.toThrow(/ポイントを選択/);
    });

    it('diveSiteId だけ指定すれば location が空でも通過する（マスタ参照）', async () => {
        await expect(
            diveSchema.validate({ ...validBase, location: '', diveSiteId: 'site-1' }),
        ).resolves.toMatchObject({ diveSiteId: 'site-1', location: null });
    });

    it('diveSiteId と location を両方指定すると失敗する（排他）', async () => {
        await expect(
            diveSchema.validate({ ...validBase, location: '伊豆 / 大瀬崎', diveSiteId: 'site-1' }),
        ).rejects.toThrow(/どちらか一方/);
    });

    it('maxDepthM が 0 以下だと失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, maxDepthM: 0 })).rejects.toThrow(/最大水深/);
        await expect(diveSchema.validate({ ...validBase, maxDepthM: -1 })).rejects.toThrow(/最大水深/);
    });

    it('bottomTimeMin が 1 未満だと失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, bottomTimeMin: 0 })).rejects.toThrow(/潜水時間/);
    });

    it('未来日付の diveDate は失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, diveDate: '9999-12-31' })).rejects.toThrow(/正しい日付/);
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

    it('diveDate のフォーマットが不正だと失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, diveDate: '2026/01/01' })).rejects.toThrow(/正しい日付/);
        await expect(diveSchema.validate({ ...validBase, diveDate: 'invalid' })).rejects.toThrow(/正しい日付/);
    });

    it('diveDate が 1900-01-01 より前だと失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, diveDate: '1899-12-31' })).rejects.toThrow(/正しい日付/);
    });

    it('diveDate 必須エラーは未指定時に出る', async () => {
        const { diveDate: _, ...withoutDate } = validBase;
        await expect(diveSchema.validate(withoutDate)).rejects.toThrow(/潜水日/);
    });

    it('entryTime / exitTime は HH:MM 形式を受理する', async () => {
        const result = await diveSchema.validate({ ...validBase, entryTime: '09:30', exitTime: '10:15' });
        expect(result.entryTime).toBe('09:30');
        expect(result.exitTime).toBe('10:15');
    });

    it('entryTime の形式が不正だと失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, entryTime: '9:30' })).rejects.toThrow(/HH:MM/);
        await expect(diveSchema.validate({ ...validBase, entryTime: 'abc' })).rejects.toThrow(/HH:MM/);
    });

    it('entryTime / exitTime が空文字なら null に変換される', async () => {
        const result = await diveSchema.validate({ ...validBase, entryTime: '', exitTime: '' });
        expect(result.entryTime).toBeNull();
        expect(result.exitTime).toBeNull();
    });

    it('diveNumber は文字列でも数値に変換される', async () => {
        const result = await diveSchema.validate({ ...validBase, diveNumber: '42' });
        expect(result.diveNumber).toBe(42);
    });

    it('diveNumber が負の値だと失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, diveNumber: -1 })).rejects.toThrow(/ダイブ番号/);
    });

    it('airTempC / waterTempC の min / max を超えると失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, airTempC: -31 })).rejects.toThrow(/気温/);
        await expect(diveSchema.validate({ ...validBase, airTempC: 61 })).rejects.toThrow(/気温/);
        await expect(diveSchema.validate({ ...validBase, waterTempC: -6 })).rejects.toThrow(/水温/);
        await expect(diveSchema.validate({ ...validBase, waterTempC: 46 })).rejects.toThrow(/水温/);
    });

    it('visibilityM の境界を超えると失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, visibilityM: -1 })).rejects.toThrow(/透明度/);
        await expect(diveSchema.validate({ ...validBase, visibilityM: 101 })).rejects.toThrow(/透明度/);
    });

    it('maxDepthM が 300 を超えると失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, maxDepthM: 301 })).rejects.toThrow(/最大水深/);
    });

    it('avgDepthM が 0 以下 / 300 超で失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, avgDepthM: 0 })).rejects.toThrow(/平均水深/);
        await expect(diveSchema.validate({ ...validBase, avgDepthM: 301 })).rejects.toThrow(/平均水深/);
    });

    it('avgDepthM が maxDepthM を超えると失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, maxDepthM: 18, avgDepthM: 20 })).rejects.toThrow(
            /平均水深は最大水深以下/,
        );
    });

    it('avgDepthM と maxDepthM が等しい場合は通過する', async () => {
        const result = await diveSchema.validate({ ...validBase, maxDepthM: 18, avgDepthM: 18 });
        expect(result.avgDepthM).toBe(18);
    });

    it('avgDepthM が maxDepthM 未満なら通過する', async () => {
        const result = await diveSchema.validate({ ...validBase, maxDepthM: 18, avgDepthM: 12 });
        expect(result.avgDepthM).toBe(12);
    });

    it('avgDepthM が空（null）なら maxDepthM との比較はスキップされる', async () => {
        const result = await diveSchema.validate({ ...validBase, maxDepthM: 18 });
        expect(result.avgDepthM).toBeNull();
    });

    it('bottomTimeMin が小数だと失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, bottomTimeMin: 1.5 })).rejects.toThrow(/整数/);
    });

    it('bottomTimeMin が 1440 を超えると失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, bottomTimeMin: 1441 })).rejects.toThrow(/潜水時間/);
    });

    it('tankVolumeL / 残圧 / weightKg の境界を超えると失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, tankVolumeL: 0 })).rejects.toThrow(/タンク容量/);
        await expect(diveSchema.validate({ ...validBase, tankVolumeL: 51 })).rejects.toThrow(/タンク容量/);
        await expect(diveSchema.validate({ ...validBase, pressureStartBar: 401 })).rejects.toThrow(/開始残圧/);
        await expect(diveSchema.validate({ ...validBase, pressureEndBar: -1 })).rejects.toThrow(/終了残圧/);
        await expect(diveSchema.validate({ ...validBase, weightKg: 31 })).rejects.toThrow(/ウェイト/);
    });

    it('pressureEndBar が pressureStartBar より大きいと失敗する', async () => {
        await expect(diveSchema.validate({ ...validBase, pressureStartBar: 100, pressureEndBar: 150 })).rejects.toThrow(
            /終了残圧は開始残圧以下/,
        );
    });

    it('pressureEndBar が pressureStartBar 以下であれば通過する', async () => {
        await expect(
            diveSchema.validate({ ...validBase, pressureStartBar: 200, pressureEndBar: 50 }),
        ).resolves.toMatchObject({ pressureStartBar: 200, pressureEndBar: 50 });
        await expect(
            diveSchema.validate({ ...validBase, pressureStartBar: 100, pressureEndBar: 100 }),
        ).resolves.toMatchObject({ pressureEndBar: 100 });
    });

    it('文字列項目の空文字は null に変換される', async () => {
        const result = await diveSchema.validate({
            ...validBase,
            diveType: '',
            weather: '',
            wave: '',
            currentCondition: '',
            tankType: '',
            gasType: '',
            suitType: '',
            equipmentNotes: '',
            buddyName: '',
            instructorName: '',
            notes: '',
        });
        expect(result.notes).toBeNull();
        expect(result.buddyName).toBeNull();
    });

    it('certificationDive は未指定だと false', async () => {
        const result = await diveSchema.validate(validBase);
        expect(result.certificationDive).toBe(false);
    });
});

describe('diveSearchSchema', () => {
    it('全て空でも通過する', async () => {
        await expect(diveSearchSchema.validate({})).resolves.toEqual({
            diveNumber: null,
            diveDate: null,
            location: null,
        });
    });

    it('不正な diveDate は失敗する', async () => {
        await expect(diveSearchSchema.validate({ diveDate: '2026/01/01' })).rejects.toThrow(/正しい日付/);
    });

    it('diveNumber は数値に変換される', async () => {
        const result = await diveSearchSchema.validate({ diveNumber: '12' });
        expect(result.diveNumber).toBe(12);
    });

    it('負の diveNumber は失敗する', async () => {
        await expect(diveSearchSchema.validate({ diveNumber: -1 })).rejects.toThrow(/0以上/);
    });

    it('location は trim されて null/値が決まる', async () => {
        const result = await diveSearchSchema.validate({ location: '   ' });
        expect(result.location).toBeNull();

        const result2 = await diveSearchSchema.validate({ location: '伊豆' });
        expect(result2.location).toBe('伊豆');
    });
});
