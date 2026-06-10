import * as yup from 'yup';

import { userProfileFields } from './user-profile';

const profileSchema = yup.object({ ...userProfileFields });

/** 全項目が有効な入力値 */
const validInput = {
    lastName: '山田',
    firstName: '太郎',
    lastNameRomaji: 'Yamada',
    firstNameRomaji: 'Taro',
    nickname: 'たろちゃん',
    birthOn: '1990-01-01',
    gender: 'male',
    heightCm: 170.5,
    weightKg: 60,
};

describe('userProfileFields', () => {
    it('有効な入力をすべて受け付ける', async () => {
        await expect(profileSchema.validate(validInput)).resolves.toEqual(validInput);
    });

    it('姓・名は前後の空白を trim する', async () => {
        const result = await profileSchema.validate({ ...validInput, lastName: ' 山田 ', firstName: ' 太郎 ' });

        expect(result.lastName).toBe('山田');
        expect(result.firstName).toBe('太郎');
    });

    it.each([
        ['lastName', '', '姓を入力してください'],
        ['firstName', '', '名を入力してください'],
        ['lastNameRomaji', '山田', '姓（ローマ字）は半角英字で入力してください'],
        ['firstNameRomaji', '太郎', '名（ローマ字）は半角英字で入力してください'],
        ['nickname', '', 'ニックネームを入力してください'],
        ['birthOn', 'invalid', '正しい日付を入力してください'],
        ['gender', 'other', '性別を選択してください'],
    ])('%s が不正な値 %s だとエラーになる', async (field, value, message) => {
        await expect(profileSchema.validate({ ...validInput, [field]: value })).rejects.toThrow(message);
    });

    it('51文字以上の姓はエラーになる', async () => {
        await expect(profileSchema.validate({ ...validInput, lastName: 'あ'.repeat(51) })).rejects.toThrow(
            '姓は50文字以内で入力してください',
        );
    });

    it('birthOn は 1900-01-01 より前だとエラーになる', async () => {
        await expect(profileSchema.validate({ ...validInput, birthOn: '1899-12-31' })).rejects.toThrow(
            '正しい日付を入力してください',
        );
    });

    it('birthOn は未来日だとエラーになる', async () => {
        await expect(profileSchema.validate({ ...validInput, birthOn: '2999-01-01' })).rejects.toThrow(
            '正しい日付を入力してください',
        );
    });

    it('身長・体重は空文字を null に変換する（任意入力）', async () => {
        const result = await profileSchema.validate({ ...validInput, heightCm: '', weightKg: '' });

        expect(result.heightCm).toBeNull();
        expect(result.weightKg).toBeNull();
    });

    it.each([
        ['heightCm', 29, '身長は30cm以上で入力してください'],
        ['heightCm', 301, '身長は300cm以下で入力してください'],
        ['weightKg', 0, '体重は1kg以上で入力してください'],
        ['weightKg', 501, '体重は500kg以下で入力してください'],
    ])('%s が範囲外の %d だとエラーになる', async (field, value, message) => {
        await expect(profileSchema.validate({ ...validInput, [field]: value })).rejects.toThrow(message);
    });

    it('身長・体重に数値以外を入力するとエラーになる', async () => {
        await expect(profileSchema.validate({ ...validInput, heightCm: 'abc' })).rejects.toThrow(
            '身長は数値で入力してください',
        );
        await expect(profileSchema.validate({ ...validInput, weightKg: 'abc' })).rejects.toThrow(
            '体重は数値で入力してください',
        );
    });
});
