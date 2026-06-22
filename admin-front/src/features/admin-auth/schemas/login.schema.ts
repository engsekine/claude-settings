import * as yup from 'yup';

import { emailField } from '@/shared/schemas/fields';

export const loginSchema = yup.object({
    email: emailField,
    /** ログインでは長さ制限は課さず必須チェックのみ */
    password: yup.string().required('パスワードを入力してください'),
});

export type LoginFormValues = yup.InferType<typeof loginSchema>;
