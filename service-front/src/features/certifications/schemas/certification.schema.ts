import * as yup from 'yup';

import {
    ACQUIRED_LOCATION_MAX_LENGTH,
    ACQUIRED_ON_MIN_DATE,
    AGENCIES,
    CERTIFICATION_RANK_MAX_LENGTH,
    DIVER_NUMBER_MAX_LENGTH,
    INSTRUCTOR_NUMBER_MAX_LENGTH,
    SPECIALTY_TAG_MAX_LENGTH,
    SPECIALTY_TAGS_MAX_COUNT,
    TRAINED_BY_MAX_LENGTH,
} from '@/features/certifications/constants';
import { parseSpecialtyTags } from '@/features/certifications/lib/specialtyTags';
import type { Agency } from '@/features/certifications/types';
import { todayInJst } from '@/shared/lib/date';

/**
 * YYYY-MM-DD が 1900-01-01 〜 JST の今日の範囲かチェック（過去日のみ許可）。
 * 空は required に任せるため true を返す。
 */
const isValidPastDate = (value: string | null | undefined): boolean => {
    if (!value) return true;
    if (Number.isNaN(new Date(value).getTime())) return false;
    return value >= ACQUIRED_ON_MIN_DATE && value <= todayInJst();
};

/** 任意のテキスト項目（trim・空は null・最大文字数チェック）を組み立てる */
const optionalText = (label: string, maxLength: number) =>
    yup
        .string()
        .trim()
        .max(maxLength, `${label}は${maxLength}文字以内で入力してください`)
        .transform((v) => (v === '' ? null : v))
        .nullable()
        .default(null);

export const certificationSchema = yup.object({
    agency: yup
        .string()
        .oneOf(AGENCIES, '指導団体を選択してください')
        .required('指導団体を選択してください') as yup.StringSchema<Agency>,
    rank: yup
        .string()
        .trim()
        .min(1, '資格ランクを入力してください')
        .max(CERTIFICATION_RANK_MAX_LENGTH, `資格ランクは${CERTIFICATION_RANK_MAX_LENGTH}文字以内で入力してください`)
        .required('資格ランクを入力してください'),
    acquiredOn: yup
        .string()
        .matches(/^\d{4}-\d{2}-\d{2}$/, { message: '正しい日付を入力してください', excludeEmptyString: true })
        .test('valid-past', '取得日には今日以前の日付を入力してください', isValidPastDate)
        .required('取得日を入力してください'),
    diverNumber: optionalText('ダイバーナンバー', DIVER_NUMBER_MAX_LENGTH),
    instructorNumber: optionalText('インストラクターナンバー', INSTRUCTOR_NUMBER_MAX_LENGTH),
    trainedBy: optionalText('指導者・ショップ名', TRAINED_BY_MAX_LENGTH),
    acquiredLocation: optionalText('取得場所', ACQUIRED_LOCATION_MAX_LENGTH),
    // 取得ダイブ（自分のダイブログの ID）。未選択は null。所有者確認は Server Action が行う
    diveId: yup
        .string()
        .transform((v) => (v === '' ? null : v))
        .nullable()
        .default(null),
    // カンマ区切りのテキストのまま保持し、配列化は Server Action 側で parseSpecialtyTags が行う
    specialtyTags: yup
        .string()
        .test(
            'tag-length',
            `スペシャリティタグは1つにつき${SPECIALTY_TAG_MAX_LENGTH}文字以内で入力してください`,
            (value) => parseSpecialtyTags(value ?? '').every((tag) => tag.length <= SPECIALTY_TAG_MAX_LENGTH),
        )
        .test(
            'tag-count',
            `スペシャリティタグは${SPECIALTY_TAGS_MAX_COUNT}個以内で入力してください`,
            (value) => parseSpecialtyTags(value ?? '').length <= SPECIALTY_TAGS_MAX_COUNT,
        )
        .default(''),
});

export type CertificationFormValues = yup.InferType<typeof certificationSchema>;
