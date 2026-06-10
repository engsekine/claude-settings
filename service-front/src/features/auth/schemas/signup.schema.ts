import * as yup from 'yup';

import { emailField, passwordConfirmField, passwordField } from '@/shared/schemas/fields';
import { userProfileFields } from '@/shared/schemas/user-profile';

export const signupSchema = yup.object({
    ...userProfileFields,
    email: emailField,
    password: passwordField,
    passwordConfirm: passwordConfirmField,
});

export type SignupFormValues = yup.InferType<typeof signupSchema>;
