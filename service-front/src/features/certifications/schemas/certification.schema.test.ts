import { describe, expect, it } from 'vitest';

import { certificationSchema } from './certification.schema';

const validInput = {
    agency: 'padi',
    rank: 'Open Water Diver',
    acquiredOn: '2023-04-01',
    diverNumber: '',
    instructorNumber: '',
    trainedBy: '',
    acquiredLocation: '',
    specialtyTags: '',
    diveId: '',
};

describe('certificationSchema', () => {
    it('有効な入力をパースできる', async () => {
        const result = await certificationSchema.validate(validInput);

        expect(result.agency).toBe('padi');
        expect(result.rank).toBe('Open Water Diver');
        expect(result.acquiredOn).toBe('2023-04-01');
    });

    it('指導団体が空だとエラーになる', async () => {
        await expect(certificationSchema.validate({ ...validInput, agency: '' })).rejects.toThrow(
            '指導団体を選択してください',
        );
    });

    it('指導団体が定義外の値だとエラーになる', async () => {
        await expect(certificationSchema.validate({ ...validInput, agency: 'invalid' })).rejects.toThrow(
            '指導団体を選択してください',
        );
    });

    it('資格ランクが空白のみだとエラーになる', async () => {
        await expect(certificationSchema.validate({ ...validInput, rank: '  ' })).rejects.toThrow(
            '資格ランクを入力してください',
        );
    });

    it('資格ランクの前後の空白は trim される', async () => {
        const result = await certificationSchema.validate({ ...validInput, rank: '  Rescue Diver  ' });

        expect(result.rank).toBe('Rescue Diver');
    });

    it('資格ランクが 60 文字を超えるとエラーになる', async () => {
        await expect(certificationSchema.validate({ ...validInput, rank: 'a'.repeat(61) })).rejects.toThrow(
            '資格ランクは60文字以内で入力してください',
        );
    });

    it('資格ランクが 60 文字ちょうどなら通る', async () => {
        const result = await certificationSchema.validate({ ...validInput, rank: 'a'.repeat(60) });

        expect(result.rank).toBe('a'.repeat(60));
    });

    it('取得日が空だとエラーになる', async () => {
        await expect(certificationSchema.validate({ ...validInput, acquiredOn: '' })).rejects.toThrow(
            '取得日を入力してください',
        );
    });

    it('取得日が日付形式でないとエラーになる', async () => {
        await expect(certificationSchema.validate({ ...validInput, acquiredOn: 'not-a-date' })).rejects.toThrow(
            '正しい日付を入力してください',
        );
    });

    it('取得日が未来日だとエラーになる', async () => {
        await expect(certificationSchema.validate({ ...validInput, acquiredOn: '2099-01-01' })).rejects.toThrow(
            '取得日には今日以前の日付を入力してください',
        );
    });

    it('取得日が 1900-01-01 より前だとエラーになる', async () => {
        await expect(certificationSchema.validate({ ...validInput, acquiredOn: '1899-12-31' })).rejects.toThrow(
            '取得日には今日以前の日付を入力してください',
        );
    });

    it('任意項目は空入力で null になる', async () => {
        const result = await certificationSchema.validate(validInput);

        expect(result.diverNumber).toBeNull();
        expect(result.instructorNumber).toBeNull();
        expect(result.trainedBy).toBeNull();
        expect(result.acquiredLocation).toBeNull();
        expect(result.specialtyTags).toBe('');
    });

    it('任意項目を入力するとそのまま保持される', async () => {
        const result = await certificationSchema.validate({
            ...validInput,
            diverNumber: '1234567890',
            instructorNumber: 'I-98765',
            trainedBy: '石垣島ダイビングショップ',
            acquiredLocation: '沖縄県石垣市',
            specialtyTags: 'エンリッチド・エア, ディープ',
        });

        expect(result.diverNumber).toBe('1234567890');
        expect(result.instructorNumber).toBe('I-98765');
        expect(result.trainedBy).toBe('石垣島ダイビングショップ');
        expect(result.acquiredLocation).toBe('沖縄県石垣市');
        expect(result.specialtyTags).toBe('エンリッチド・エア, ディープ');
    });

    it('ダイバーナンバーが 60 文字を超えるとエラーになる', async () => {
        await expect(certificationSchema.validate({ ...validInput, diverNumber: 'a'.repeat(61) })).rejects.toThrow(
            'ダイバーナンバーは60文字以内で入力してください',
        );
    });

    it('インストラクターナンバーが 60 文字を超えるとエラーになる', async () => {
        await expect(certificationSchema.validate({ ...validInput, instructorNumber: 'a'.repeat(61) })).rejects.toThrow(
            'インストラクターナンバーは60文字以内で入力してください',
        );
    });

    it('指導者・ショップ名が 120 文字を超えるとエラーになる', async () => {
        await expect(certificationSchema.validate({ ...validInput, trainedBy: 'a'.repeat(121) })).rejects.toThrow(
            '指導者・ショップ名は120文字以内で入力してください',
        );
    });

    it('取得場所が 120 文字を超えるとエラーになる', async () => {
        await expect(
            certificationSchema.validate({ ...validInput, acquiredLocation: 'a'.repeat(121) }),
        ).rejects.toThrow('取得場所は120文字以内で入力してください');
    });

    it('30 文字を超えるスペシャリティタグが含まれるとエラーになる', async () => {
        await expect(
            certificationSchema.validate({ ...validInput, specialtyTags: `ディープ, ${'a'.repeat(31)}` }),
        ).rejects.toThrow('スペシャリティタグは1つにつき30文字以内で入力してください');
    });

    it('スペシャリティタグが 10 個を超えるとエラーになる', async () => {
        const tags = Array.from({ length: 11 }, (_, i) => `タグ${i}`).join(',');

        await expect(certificationSchema.validate({ ...validInput, specialtyTags: tags })).rejects.toThrow(
            'スペシャリティタグは10個以内で入力してください',
        );
    });

    it('取得ダイブは未選択（空）で null になる', async () => {
        const result = await certificationSchema.validate(validInput);

        expect(result.diveId).toBeNull();
    });

    it('取得ダイブを選択すると ID が保持される', async () => {
        const result = await certificationSchema.validate({
            ...validInput,
            diveId: '11111111-1111-1111-1111-111111111111',
        });

        expect(result.diveId).toBe('11111111-1111-1111-1111-111111111111');
    });
});
