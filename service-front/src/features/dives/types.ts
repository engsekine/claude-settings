import type { TankTypeValue } from '@/features/dives/constants';

/** ダイビングログのドメイン型。DB スキーマ（snake_case）はマッピング層で camelCase に変換する */
export interface Dive {
    id: string;
    userId: string;
    diveNumber: number | null;
    /** ISO 8601 date string (YYYY-MM-DD) */
    diveDate: string;
    /** HH:MM:SS */
    entryTime: string | null;
    /** HH:MM:SS */
    exitTime: string | null;
    location: string;
    diveType: string | null;
    weather: string | null;
    airTempC: number | null;
    waterTempC: number | null;
    visibilityM: number | null;
    wave: string | null;
    currentCondition: string | null;
    maxDepthM: number;
    avgDepthM: number | null;
    bottomTimeMin: number;
    tankType: TankTypeValue | null;
    tankVolumeL: number | null;
    gasType: string | null;
    o2Percent: number | null;
    pressureStartBar: number | null;
    pressureEndBar: number | null;
    weightKg: number | null;
    suitType: string | null;
    equipmentNotes: string | null;
    buddyName: string | null;
    instructorName: string | null;
    certificationDive: boolean;
    notes: string | null;
    isPublic: boolean;
    publicSlug: string | null;
    /** ISO 8601 timestamp */
    createdAt: string;
    /** ISO 8601 timestamp */
    updatedAt: string;
}

/** 一覧表示で必要な最低限の列だけを持つ軽量版 */
export type DiveListItem = Pick<
    Dive,
    | 'id'
    | 'diveNumber'
    | 'diveDate'
    | 'location'
    | 'maxDepthM'
    | 'bottomTimeMin'
    | 'waterTempC'
    | 'visibilityM'
    | 'certificationDive'
>;

/** 一覧検索の入力 */
export interface DiveListFilter {
    /** ISO 8601 date string (YYYY-MM-DD) */
    dateFrom?: string;
    /** ISO 8601 date string (YYYY-MM-DD) */
    dateTo?: string;
    location?: string;
}

/** キーセットページネーションのカーソル */
export interface DiveCursor {
    /** ISO 8601 date string (YYYY-MM-DD) */
    diveDate: string;
    id: string;
}

export interface DiveListPage {
    items: DiveListItem[];
    /** 次のページがあるときのカーソル。無いとき null */
    nextCursor: DiveCursor | null;
}
