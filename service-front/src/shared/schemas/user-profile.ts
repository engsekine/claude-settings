import * as yup from 'yup';

import { GENDER_VALUES, type Gender } from '@/shared/constants/gender';
import { isValidBirthDate } from '@/shared/lib/date';
import { isUrlSafeNickname, NICKNAME_FORBIDDEN_PATTERN } from '@/shared/lib/profile-path';
import { ROMAJI_PATTERN } from '@/shared/schemas/patterns';
import { optionalNumber } from '@/shared/schemas/transforms';

/**
 * ユーザープロフィールのフィールド定義。
 * サインアップ（auth）とプロフィール編集（account）の両スキーマで共有する。
 */
export const userProfileFields = {
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
        // プロフィール URL の判別・エンコードを壊す値を拒否する（034 / FR-006。判定は profile-path と共有）。
        // 2 段の test はエラーメッセージの出し分けが目的: 禁止文字は具体的な文字を提示し、
        // 予約語・uuid 形式は url-safe 側の汎用メッセージで拒否する（yup は先に失敗した方を返す）
        .test('no-forbidden-chars', 'ニックネームに / ? # % \\ は使用できません', (value) => {
            if (!value) return true;
            return !NICKNAME_FORBIDDEN_PATTERN.test(value);
        })
        .test('url-safe', 'このニックネームは使用できません', (value) => {
            if (!value) return true;
            return isUrlSafeNickname(value);
        })
        .required('ニックネームを入力してください'),
    birthOn: yup
        .string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, '正しい日付を入力してください')
        .test('valid-range', '正しい日付を入力してください', isValidBirthDate)
        .required('生年月日を入力してください'),
    gender: yup
        .mixed<Gender>()
        .oneOf([...GENDER_VALUES], '性別を選択してください')
        .required('性別を選択してください'),
    heightCm: yup
        .number()
        .typeError('身長は数値で入力してください')
        .transform(optionalNumber)
        .nullable()
        .min(30, '身長は30cm以上で入力してください')
        .max(300, '身長は300cm以下で入力してください')
        .defined(),
    weightKg: yup
        .number()
        .typeError('体重は数値で入力してください')
        .transform(optionalNumber)
        .nullable()
        .min(1, '体重は1kg以上で入力してください')
        .max(500, '体重は500kg以下で入力してください')
        .defined(),
};
