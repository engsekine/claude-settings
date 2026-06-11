import * as yup from 'yup';

import {
    OVERHAUL_INTERVAL_DIVES,
    OVERHAUL_INTERVAL_MONTHS,
    REGULATOR_BRAND_MAX_LENGTH,
    REGULATOR_MODEL_MAX_LENGTH,
    REGULATOR_NOTES_MAX_LENGTH,
} from '@/features/regulators/constants';
import { todayInJst } from '@/shared/lib/date';

/**
 * YYYY-MM-DD が 1900-01-01 〜 JST の今日の範囲かチェック（過去日のみ許可）。
 * 空は required / nullable に任せるため true を返す。
 */
const isValidPastDate = (value: string | null | undefined): boolean => {
    if (!value) return true;
    if (Number.isNaN(new Date(value).getTime())) return false;
    return value >= '1900-01-01' && value <= todayInJst();
};

/** 空入力を undefined にして yup の default を効かせる（OH 周期はデフォルト値で補完するため） */
const emptyToDefault = (value: number, originalValue: unknown): number | undefined => {
    if (originalValue === '' || originalValue == null) return undefined;
    return value;
};

export const regulatorSchema = yup.object({
    brand: yup
        .string()
        .trim()
        .min(1, 'メーカー名を入力してください')
        .max(REGULATOR_BRAND_MAX_LENGTH, `メーカー名は${REGULATOR_BRAND_MAX_LENGTH}文字以内で入力してください`)
        .required('メーカー名を入力してください'),
    model: yup
        .string()
        .trim()
        .min(1, 'モデル名を入力してください')
        .max(REGULATOR_MODEL_MAX_LENGTH, `モデル名は${REGULATOR_MODEL_MAX_LENGTH}文字以内で入力してください`)
        .required('モデル名を入力してください'),
    purchasedOn: yup
        .string()
        .transform((v) => (v === '' || v == null ? null : v))
        .nullable()
        .matches(/^\d{4}-\d{2}-\d{2}$/, { message: '正しい日付を入力してください', excludeEmptyString: true })
        .test('valid-past', '正しい日付を入力してください', isValidPastDate)
        .default(null),
    lastOverhauledOn: yup
        .string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, { message: '正しい日付を入力してください', excludeEmptyString: true })
        .test('valid-past', '今日以前の日付を入力してください', isValidPastDate)
        .required('前回オーバーホール日を入力してください'),
    overhaulIntervalMonths: yup
        .number()
        .typeError('OH 周期（月）は数値で入力してください')
        .transform(emptyToDefault)
        .integer('OH 周期（月）は整数で入力してください')
        .min(OVERHAUL_INTERVAL_MONTHS.min, `OH 周期（月）は${OVERHAUL_INTERVAL_MONTHS.min}以上で入力してください`)
        .max(OVERHAUL_INTERVAL_MONTHS.max, `OH 周期（月）は${OVERHAUL_INTERVAL_MONTHS.max}以下で入力してください`)
        .default(OVERHAUL_INTERVAL_MONTHS.default)
        .required('OH 周期（月）を入力してください'),
    overhaulIntervalDives: yup
        .number()
        .typeError('OH 周期（本数）は数値で入力してください')
        .transform(emptyToDefault)
        .integer('OH 周期（本数）は整数で入力してください')
        .min(OVERHAUL_INTERVAL_DIVES.min, `OH 周期（本数）は${OVERHAUL_INTERVAL_DIVES.min}以上で入力してください`)
        .max(OVERHAUL_INTERVAL_DIVES.max, `OH 周期（本数）は${OVERHAUL_INTERVAL_DIVES.max}以下で入力してください`)
        .default(OVERHAUL_INTERVAL_DIVES.default)
        .required('OH 周期（本数）を入力してください'),
    isPrimary: yup.boolean().default(false).required(),
    notes: yup
        .string()
        .trim()
        .max(REGULATOR_NOTES_MAX_LENGTH, `メモは${REGULATOR_NOTES_MAX_LENGTH}文字以内で入力してください`)
        .transform((v) => (v === '' ? null : v))
        .nullable()
        .default(null),
});

export type RegulatorFormValues = yup.InferType<typeof regulatorSchema>;
