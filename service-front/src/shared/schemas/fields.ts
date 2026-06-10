import * as yup from 'yup';

/**
 * 複数フォームで共有する yup フィールド定義。
 * バリデーションメッセージの表記ゆれを防ぐため、必ずここから import する。
 */

export const emailField = yup
    .string()
    .email('正しいメールアドレスを入力してください')
    .required('メールアドレスを入力してください');

export const passwordField = yup
    .string()
    .min(6, 'パスワードは6文字以上で入力してください')
    .required('パスワードを入力してください');

/** `password` フィールドとの一致を検証する確認用フィールド */
export const passwordConfirmField = yup
    .string()
    .oneOf([yup.ref('password')], 'パスワードが一致しません')
    .required('確認用パスワードを入力してください');
