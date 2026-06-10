import * as yup from 'yup';

import { emailField, passwordConfirmField, passwordField } from './fields';

/** passwordConfirmField は yup.ref('password') を参照するためオブジェクトスキーマで検証する */
const passwordPairSchema = yup.object({
    password: passwordField,
    passwordConfirm: passwordConfirmField,
});

describe('emailField', () => {
    it('正しいメールアドレスを受け付ける', async () => {
        await expect(emailField.validate('user@example.com')).resolves.toBe('user@example.com');
    });

    it('不正な形式はエラーになる', async () => {
        await expect(emailField.validate('invalid-email')).rejects.toThrow('正しいメールアドレスを入力してください');
    });

    it('未入力はエラーになる', async () => {
        await expect(emailField.validate(undefined)).rejects.toThrow('メールアドレスを入力してください');
    });
});

describe('passwordField', () => {
    it('6文字以上を受け付ける', async () => {
        await expect(passwordField.validate('abcdef')).resolves.toBe('abcdef');
    });

    it('5文字以下はエラーになる', async () => {
        await expect(passwordField.validate('abcde')).rejects.toThrow('パスワードは6文字以上で入力してください');
    });

    it('未入力はエラーになる', async () => {
        await expect(passwordField.validate(undefined)).rejects.toThrow('パスワードを入力してください');
    });
});

describe('passwordConfirmField', () => {
    it('password と一致すれば通る', async () => {
        await expect(
            passwordPairSchema.validate({ password: 'password123', passwordConfirm: 'password123' }),
        ).resolves.toEqual({ password: 'password123', passwordConfirm: 'password123' });
    });

    it('password と不一致はエラーになる', async () => {
        await expect(
            passwordPairSchema.validate({ password: 'password123', passwordConfirm: 'different' }),
        ).rejects.toThrow('パスワードが一致しません');
    });

    it('未入力はエラーになる', async () => {
        await expect(passwordPairSchema.validate({ password: 'password123' })).rejects.toThrow(
            '確認用パスワードを入力してください',
        );
    });
});
