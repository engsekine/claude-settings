import * as yup from 'yup';

export const resetPasswordRequestSchema = yup.object({
    email: yup
        .string()
        .email('正しいメールアドレスを入力してください')
        .required('メールアドレスを入力してください'),
});

export type ResetPasswordRequestFormValues = yup.InferType<typeof resetPasswordRequestSchema>;

export const resetPasswordSchema = yup.object({
    password: yup
        .string()
        .min(6, 'パスワードは6文字以上で入力してください')
        .required('パスワードを入力してください'),
    passwordConfirm: yup
        .string()
        .oneOf([yup.ref('password')], 'パスワードが一致しません')
        .required('確認用パスワードを入力してください'),
});

export type ResetPasswordFormValues = yup.InferType<typeof resetPasswordSchema>;
