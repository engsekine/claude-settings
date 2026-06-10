import * as yup from 'yup';

import { emailField } from '@/shared/schemas/fields';

export const loginSchema = yup.object({
    email: emailField,
    /**
     * 既存ユーザーのパスワード長を制限しないため、ログインでは
     * 共有の passwordField（min 6）を使わず必須チェックのみ行う。
     */
    password: yup.string().required('パスワードを入力してください'),
});

export type LoginFormValues = yup.InferType<typeof loginSchema>;
