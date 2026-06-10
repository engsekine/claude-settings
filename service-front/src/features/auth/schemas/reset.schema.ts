import * as yup from 'yup';

import { emailField, passwordConfirmField, passwordField } from '@/shared/schemas/fields';

export const resetPasswordRequestSchema = yup.object({
    email: emailField,
});

export type ResetPasswordRequestFormValues = yup.InferType<typeof resetPasswordRequestSchema>;

export const resetPasswordSchema = yup.object({
    password: passwordField,
    passwordConfirm: passwordConfirmField,
});

export type ResetPasswordFormValues = yup.InferType<typeof resetPasswordSchema>;
