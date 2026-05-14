import * as yup from 'yup';

import { GENDER_VALUES, type Gender } from '@/shared/constants/gender';

/** ローマ字パターン: 半角英字 + 空白 + ハイフン + アポストロフィ */
const ROMAJI_PATTERN = /^[A-Za-z][A-Za-z\s'-]*$/;

/** YYYY-MM-DD の日付文字列が 1900-01-01 〜 当日の範囲内かチェック */
const isBirthOnValid = (value: string | undefined): boolean => {
    if (!value) return false;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return false;
    return date >= new Date('1900-01-01') && date <= new Date();
};

export const profileSchema = yup.object({
    lastName: yup
        .string()
        .trim()
        .min(1, '姓を入力してください')
        .max(50, '姓は50文字以内で入力してください')
        .required('姓を入力してください'),
    firstName: yup
        .string()
        .trim()
        .min(1, '名を入力してください')
        .max(50, '名は50文字以内で入力してください')
        .required('名を入力してください'),
    lastNameRomaji: yup
        .string()
        .trim()
        .matches(ROMAJI_PATTERN, '姓（ローマ字）は半角英字で入力してください')
        .max(50, '姓（ローマ字）は50文字以内で入力してください')
        .required('姓（ローマ字）を入力してください'),
    firstNameRomaji: yup
        .string()
        .trim()
        .matches(ROMAJI_PATTERN, '名（ローマ字）は半角英字で入力してください')
        .max(50, '名（ローマ字）は50文字以内で入力してください')
        .required('名（ローマ字）を入力してください'),
    nickname: yup
        .string()
        .trim()
        .min(1, 'ニックネームを入力してください')
        .max(50, 'ニックネームは50文字以内で入力してください')
        .required('ニックネームを入力してください'),
    birthOn: yup
        .string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, '正しい日付を入力してください')
        .test('valid-range', '正しい日付を入力してください', isBirthOnValid)
        .required('生年月日を入力してください'),
    gender: yup
        .mixed<Gender>()
        .oneOf([...GENDER_VALUES], '性別を選択してください')
        .required('性別を選択してください'),
});

export type ProfileFormValues = yup.InferType<typeof profileSchema>;
