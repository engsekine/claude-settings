import * as yup from 'yup';

/** キャプションの最大文字数（DB の CHECK と一致させる。data-model.md） */
export const PHOTO_CAPTION_MAX_LENGTH = 200;

/** 写真キャプションの入力スキーマ。空文字＝未設定を許容する（FR-012） */
export const photoCaptionSchema = yup.object({
    caption: yup
        .string()
        .ensure()
        .max(PHOTO_CAPTION_MAX_LENGTH, `キャプションは ${PHOTO_CAPTION_MAX_LENGTH} 文字以内で入力してください`)
        .default(''),
});

export type PhotoCaptionValues = yup.InferType<typeof photoCaptionSchema>;
