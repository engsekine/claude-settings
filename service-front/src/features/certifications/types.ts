import type { Database } from '@repo/supabase';

type CertificationRow = Database['public']['Tables']['certifications']['Row'];

/** 指導団体（DB CHECK 制約の 6 値と同期） */
export type Agency = 'padi' | 'naui' | 'ssi' | 'bsac' | 'cmas' | 'other';

/** 紐づく取得ダイブの表示用サマリー */
export interface CertificationDive {
    id: string;
    /** ダイブ日（YYYY-MM-DD） */
    diveDate: string;
    location: string;
}

/** 保有資格 */
export interface Certification {
    id: string;
    agency: Agency;
    rank: string;
    /** 取得日（YYYY-MM-DD） */
    acquiredOn: string;
    /** C カードのダイバーナンバー（任意） */
    diverNumber: string | null;
    /** 認定インストラクターのナンバー（任意） */
    instructorNumber: string | null;
    /** 講習を受けた指導者・ショップ名（任意） */
    trainedBy: string | null;
    /** 取得場所（任意） */
    acquiredLocation: string | null;
    /** 資格を取得したダイブログ（任意。ログ削除で null に戻る） */
    dive: CertificationDive | null;
    /** スペシャリティタグ */
    tags: string[];
    createdAt: string;
    updatedAt: string;
}

/** DB row（+ 子テーブルのタグ・取得ダイブ）→ Certification 変換 */
export const mapCertification = (
    row: CertificationRow,
    tags: string[] = [],
    dive: CertificationDive | null = null,
): Certification => ({
    id: row.id,
    agency: row.agency as Agency,
    rank: row.rank,
    acquiredOn: row.acquired_on,
    diverNumber: row.diver_number,
    instructorNumber: row.instructor_number,
    trainedBy: row.trained_by,
    acquiredLocation: row.acquired_location,
    dive,
    tags,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});
