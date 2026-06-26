import { describe, expect, it } from 'vitest';

import { signupSchema } from './signup.schema';

const validInput = {
    lastName: '山田',
    firstName: '太郎',
    lastNameRomaji: 'Yamada',
    firstNameRomaji: 'Taro',
    nickname: 'たろちゃん',
    birthOn: '1990-01-01',
    gender: 'male',
    heightCm: '',
    weightKg: '',
    email: 'user@example.com',
    password: 'Password1234',
    passwordConfirm: 'Password1234',
    agreedToTerms: true,
};

describe('signupSchema - agreedToTerms（018）', () => {
    it('利用規約に同意（true）していれば通過する', () => {
        expect(() => signupSchema.validateSync(validInput)).not.toThrow();
    });

    it('利用規約に同意していない（false）と拒否する', () => {
        expect(() => signupSchema.validateSync({ ...validInput, agreedToTerms: false })).toThrow(
            '利用規約に同意してください',
        );
    });

    it('agreedToTerms が未指定だと拒否する', () => {
        const { agreedToTerms, ...withoutAgree } = validInput;
        void agreedToTerms;
        expect(() => signupSchema.validateSync(withoutAgree)).toThrow();
    });
});
