import type { Database } from '@repo/supabase';

/** 有無系ラジオの値。'' = 未選択（出力は空欄のまま） */
export type YesNoValue = '' | 'yes' | 'no';

/** 性別の選択値。'' = 未選択（`unanswered` 相当・出力は空欄） */
export type SheetGenderValue = '' | 'male' | 'female';

/** コンタクトレンズの種類（DB CHECK 制約の 3 値と同期。'' = 未選択） */
export type ContactLensTypeValue = '' | 'hard' | 'soft' | 'disposable';

/** レンタル品目のキー（14 種）。表示順・ラベルは constants の RENTAL_ITEMS が正 */
export type RentalItemKey =
    | 'wetSuitFullSet'
    | 'drySuitFullSet'
    | 'maskSnorkel'
    | 'fin'
    | 'glove'
    | 'boots'
    | 'wetSuit'
    | 'wetVest'
    | 'drySuit'
    | 'bc'
    | 'regulator'
    | 'diveComputer'
    | 'underwaterLight'
    | 'underwaterCamera';

/**
 * 申し込みシートフォームの入力値。
 * 全項目任意（FR-005）。数値系は入力欄の文字列のまま保持し、buildSheetText で整形する。
 */
export interface SheetFormValues {
    fullName: string;
    /** 年齢（数字文字列） */
    age: string;
    /** 生年月日（YYYY-MM-DD） */
    birthOn: string;
    gender: SheetGenderValue;
    phone: string;
    emergencyContactRelation: string;
    emergencyContactPhone: string;
    nearestStation: string;
    licenseRank: string;
    /** 経験本数（数字文字列） */
    diveCount: string;
    hasIzuChibaExperience: YesNoValue;
    hasBoatExperience: YesNoValue;
    /** 最終ダイブ年月（YYYY-MM） */
    lastDiveYearMonth: string;
    hasDrySuitExperience: YesNoValue;
    /** ドライスーツの経験本数 約（数字文字列） */
    drySuitDiveCount: string;
    /** レンタル器材の有無 */
    hasRental: YesNoValue;
    rentalItems: RentalItemKey[];
    /** レンタル「無」時に品目〜サイズ欄ブロックを出力から省略する（FR-012。保存対象外） */
    omitRentalBlock: boolean;
    heightCm: string;
    weightKg: string;
    footSizeCm: string;
    hasContactLens: YesNoValue;
    contactLensType: ContactLensTypeValue;
    /** 度付きマスクレンタルの要否（yes = 要 / no = 不要） */
    needsPrescriptionMask: YesNoValue;
}

export type ApplicationProfileRow = Database['public']['Tables']['application_profiles']['Row'];

/** 保存済み application_profiles（camelCase）。boolean の null は「未入力」 */
export interface SavedApplicationProfile {
    phone: string;
    emergencyContactRelation: string;
    emergencyContactPhone: string;
    nearestStation: string;
    footSizeCm: number | null;
    hasIzuChibaExperience: boolean | null;
    hasBoatExperience: boolean | null;
    hasDrySuitExperience: boolean | null;
    drySuitDiveCount: number | null;
    hasContactLens: boolean | null;
    contactLensType: 'hard' | 'soft' | 'disposable' | null;
    needsPrescriptionMask: boolean | null;
}

/** DB row → SavedApplicationProfile 変換 */
export const mapSavedApplicationProfile = (row: ApplicationProfileRow): SavedApplicationProfile => ({
    phone: row.phone,
    emergencyContactRelation: row.emergency_contact_relation,
    emergencyContactPhone: row.emergency_contact_phone,
    nearestStation: row.nearest_station,
    footSizeCm: row.foot_size_cm,
    hasIzuChibaExperience: row.has_izu_chiba_experience,
    hasBoatExperience: row.has_boat_experience,
    hasDrySuitExperience: row.has_dry_suit_experience,
    drySuitDiveCount: row.dry_suit_dive_count,
    hasContactLens: row.has_contact_lens,
    contactLensType: row.contact_lens_type as SavedApplicationProfile['contactLensType'],
    needsPrescriptionMask: row.needs_prescription_mask,
});

/**
 * 自動入力データ（FR-007）。未登録のソースは null（FR-009）。
 * gender は `unanswered` を null に落とす（空欄扱い）。
 */
export interface SheetPrefill {
    fullName: string | null;
    /** YYYY-MM-DD */
    birthOn: string | null;
    /** 生年月日から算出した年齢（JST 基準） */
    age: number | null;
    gender: 'male' | 'female' | null;
    heightCm: number | null;
    weightKg: number | null;
    licenseRank: string | null;
    diveCount: number | null;
    /** YYYY-MM */
    lastDiveYearMonth: string | null;
    savedProfile: SavedApplicationProfile | null;
}
