import { describe, expect, it } from 'vitest';

import { regulatorSchema } from './regulator.schema';

const validInput = {
    brand: 'SCUBAPRO',
    model: 'MK25 EVO / S620Ti',
    purchasedOn: '',
    lastOverhauledOn: '2026-01-15',
    overhaulIntervalMonths: 12,
    overhaulIntervalDives: 100,
    isPrimary: false,
    notes: '',
};

describe('regulatorSchema', () => {
    it('有効な入力をパースできる（空の任意項目は null になる）', async () => {
        const result = await regulatorSchema.validate(validInput);

        expect(result.brand).toBe('SCUBAPRO');
        expect(result.purchasedOn).toBeNull();
        expect(result.notes).toBeNull();
        expect(result.overhaulIntervalMonths).toBe(12);
    });

    it('メーカー名が空だとエラーになる', async () => {
        await expect(regulatorSchema.validate({ ...validInput, brand: '  ' })).rejects.toThrow(
            'メーカー名を入力してください',
        );
    });

    it('メーカー名が 60 文字を超えるとエラーになる', async () => {
        await expect(regulatorSchema.validate({ ...validInput, brand: 'a'.repeat(61) })).rejects.toThrow(
            'メーカー名は60文字以内で入力してください',
        );
    });

    it('モデル名が 80 文字を超えるとエラーになる', async () => {
        await expect(regulatorSchema.validate({ ...validInput, model: 'a'.repeat(81) })).rejects.toThrow(
            'モデル名は80文字以内で入力してください',
        );
    });

    it('前回 OH 日が空だとエラーになる', async () => {
        await expect(regulatorSchema.validate({ ...validInput, lastOverhauledOn: '' })).rejects.toThrow(
            '前回オーバーホール日を入力してください',
        );
    });

    it('前回 OH 日が未来日だとエラーになる', async () => {
        await expect(regulatorSchema.validate({ ...validInput, lastOverhauledOn: '2099-01-01' })).rejects.toThrow(
            '今日以前の日付を入力してください',
        );
    });

    it('OH 周期（月）が 0 以下だとエラーになる', async () => {
        await expect(regulatorSchema.validate({ ...validInput, overhaulIntervalMonths: 0 })).rejects.toThrow(
            'OH 周期（月）は1以上で入力してください',
        );
    });

    it('OH 周期（月）が 120 を超えるとエラーになる', async () => {
        await expect(regulatorSchema.validate({ ...validInput, overhaulIntervalMonths: 121 })).rejects.toThrow(
            'OH 周期（月）は120以下で入力してください',
        );
    });

    it('OH 周期（本数）が 1000 を超えるとエラーになる', async () => {
        await expect(regulatorSchema.validate({ ...validInput, overhaulIntervalDives: 1001 })).rejects.toThrow(
            'OH 周期（本数）は1000以下で入力してください',
        );
    });

    it('OH 周期は空入力でデフォルト値（12 / 100）になる', async () => {
        const result = await regulatorSchema.validate({
            ...validInput,
            overhaulIntervalMonths: '',
            overhaulIntervalDives: '',
        });

        expect(result.overhaulIntervalMonths).toBe(12);
        expect(result.overhaulIntervalDives).toBe(100);
    });

    it('メモが 500 文字を超えるとエラーになる', async () => {
        await expect(regulatorSchema.validate({ ...validInput, notes: 'あ'.repeat(501) })).rejects.toThrow(
            'メモは500文字以内で入力してください',
        );
    });
});
