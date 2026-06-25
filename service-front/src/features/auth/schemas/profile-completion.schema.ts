import * as yup from 'yup';

import { userProfileFields } from '@/shared/schemas/user-profile';

/**
 * Google ログイン初回時のプロフィール補完フォーム（016-google-login）。
 * メール / パスワードは持たないため、共有の userProfileFields のみで構成する。
 * バリデーション基準は 001-auth のサインアップ・account のプロフィール編集と同一。
 */
export const profileCompletionSchema = yup.object({
    ...userProfileFields,
});

export type ProfileCompletionFormValues = yup.InferType<typeof profileCompletionSchema>;
