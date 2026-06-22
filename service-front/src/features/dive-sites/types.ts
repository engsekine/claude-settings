/** ダイブサイト（マスタ）。全ユーザー共有の参照データ */
export interface DiveSite {
    id: string;
    /** ポイント名（一意） */
    name: string;
    /** エリア / 地域（例: 伊豆）。未設定は null */
    area: string | null;
    /** 国コード（既定は日本 = JP） */
    country: string;
    /** 説明（任意） */
    description: string | null;
}

/** ダイブサイト選択肢（検索選択 UI 用）。label は siteLabel で組み立てる */
export interface DiveSiteOption {
    value: string;
    label: string;
}

/**
 * サイト別実績（導出値・保存しない）。本人のログから算出する。
 * bestSeasonMonths は本数が多い月の上位 3 ヶ月（1–12、同数は月昇順）。
 * 対象ログが 3 本未満のときは傾向を出さないため空配列。
 */
export interface SiteStats {
    diveCount: number;
    /** 平均透明度（m、小数 1 桁）。透明度記録が 0 件なら null */
    avgVisibilityM: number | null;
    /** ベストシーズン（上位 3 ヶ月）。傾向を出すにはログ不足なら空配列 */
    bestSeasonMonths: number[];
}

/** ベストシーズンの傾向を出すために必要な最小ログ数 */
export const BEST_SEASON_MIN_DIVES = 3;
