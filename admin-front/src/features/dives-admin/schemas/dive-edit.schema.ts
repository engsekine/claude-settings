import * as yup from 'yup';

/**
 * ダイブログ編集スキーマ（管理者用）。
 * DB の CHECK 制約（dives）に合わせる。location とサイト参照（dive_site_id）の排他制約に
 * 抵触しないよう、location は編集対象に含めない（一覧・詳細では参照のみ）。
 */
export const diveEditSchema = yup.object({
    dive_date: yup.string().required('潜水日を入力してください'),
    max_depth_m: yup
        .number()
        .typeError('最大水深は数値で入力してください')
        .required('最大水深を入力してください')
        .positive('最大水深は0より大きい値を入力してください')
        .max(300, '最大水深は300以下で入力してください'),
    bottom_time_min: yup
        .number()
        .typeError('潜水時間は数値で入力してください')
        .required('潜水時間を入力してください')
        .integer('潜水時間は整数で入力してください')
        .min(1, '潜水時間は1分以上で入力してください'),
    buddy_name: yup.string().trim().default(''),
    notes: yup.string().trim().default(''),
});

export type DiveEditFormValues = yup.InferType<typeof diveEditSchema>;
