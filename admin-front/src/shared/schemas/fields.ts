import * as yup from 'yup';

/** 複数フォームで共有する yup フィールド定義（表記ゆれ防止のため必ずここから import する） */
export const emailField = yup
    .string()
    .email('正しいメールアドレスを入力してください')
    .required('メールアドレスを入力してください');
