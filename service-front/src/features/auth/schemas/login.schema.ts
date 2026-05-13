import * as yup from 'yup';

export const loginSchema = yup.object({
    email: yup
        .string()
        .email('正しいメールアドレスを入力してください')
        .required('メールアドレスを入力してください'),
    password: yup
        .string()
        .required('パスワードを入力してください'),
});

export type LoginFormValues = yup.InferType<typeof loginSchema>;
