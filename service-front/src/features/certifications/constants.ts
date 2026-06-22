import type { Agency } from '@/features/certifications/types';

/** 指導団体の値 → 表示ラベル */
export const AGENCY_LABELS: Record<Agency, string> = {
    padi: 'PADI',
    naui: 'NAUI',
    ssi: 'SSI',
    bsac: 'BSAC',
    cmas: 'CMAS',
    other: 'その他',
};

/** 指導団体の選択肢（フォームの表示順） */
export const AGENCIES = Object.keys(AGENCY_LABELS) as Agency[];

/** 資格ランク名の最大文字数（DB CHECK 制約と同期） */
export const CERTIFICATION_RANK_MAX_LENGTH = 60;

/** 取得日の下限（DB CHECK 制約と同期） */
export const ACQUIRED_ON_MIN_DATE = '1900-01-01';

/** ダイバーナンバーの最大文字数（DB CHECK 制約と同期） */
export const DIVER_NUMBER_MAX_LENGTH = 60;

/** インストラクターナンバーの最大文字数（DB CHECK 制約と同期） */
export const INSTRUCTOR_NUMBER_MAX_LENGTH = 60;

/** 指導者・ショップ名の最大文字数（DB CHECK 制約と同期） */
export const TRAINED_BY_MAX_LENGTH = 120;

/** 取得場所の最大文字数（DB CHECK 制約と同期） */
export const ACQUIRED_LOCATION_MAX_LENGTH = 120;

/** スペシャリティタグ 1 つの最大文字数（DB CHECK 制約と同期） */
export const SPECIALTY_TAG_MAX_LENGTH = 30;

/** 1 資格に付与できるスペシャリティタグの最大数（アプリ側制限） */
export const SPECIALTY_TAGS_MAX_COUNT = 10;
