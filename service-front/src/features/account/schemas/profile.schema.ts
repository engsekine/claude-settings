import * as yup from 'yup';

import { optionalDiverFields } from '@/shared/schemas/diver';
import { userProfileFields } from '@/shared/schemas/user-profile';

export const profileSchema = yup.object({
    ...userProfileFields,
    ...optionalDiverFields,
});

export type ProfileFormValues = yup.InferType<typeof profileSchema>;
