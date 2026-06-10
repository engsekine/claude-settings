import * as yup from 'yup';

import { userProfileFields } from '@/shared/schemas/user-profile';

export const profileSchema = yup.object({
    ...userProfileFields,
});

export type ProfileFormValues = yup.InferType<typeof profileSchema>;
