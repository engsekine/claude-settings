import * as yup from 'yup';

/**
 * ダイブサイトの作成 / 編集スキーマ。
 * DB の CHECK 制約（dive_sites）に合わせる: name 必須 1〜100 / area 〜60 / country 〜2 / description 〜500。
 */
export const diveSiteSchema = yup.object({
    name: yup.string().trim().required('名称を入力してください').max(100, '名称は100文字以内で入力してください'),
    area: yup.string().trim().max(60, 'エリアは60文字以内で入力してください').default(''),
    country: yup
        .string()
        .trim()
        .required('国コードを入力してください')
        .max(2, '国コードは2文字以内で入力してください')
        .default('JP'),
    description: yup.string().trim().max(500, '説明は500文字以内で入力してください').default(''),
});

export type DiveSiteFormValues = yup.InferType<typeof diveSiteSchema>;
