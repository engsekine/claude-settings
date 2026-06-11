import type { OverhaulStatus } from './lib/overhaul';

/** 累計統計（get_dive_stats RPC の結果） */
export interface DiveStats {
    totalDives: number;
    totalBottomTimeMin: number;
    maxDepthM: number;
    visitedLocations: number;
}

/** TOP ヒーロー用のデータ */
export interface DashboardHero {
    /** 表示名（user_details.nickname）。未設定は null */
    nickname: string | null;
    /** 前回ダイブからの経過日数。ログ 0 件は null */
    daysSinceLastDive: number | null;
}

/** メイン機材の OH ステータス（未登録は null を返す） */
export interface PrimaryRegulatorStatus {
    regulatorId: string;
    brand: string;
    model: string;
    lastOverhauledOn: string;
    status: OverhaulStatus;
}

/** TOP の最近のログ表示用（dives 機能の row を app 層で変換して渡す） */
export interface RecentDiveItem {
    id: string;
    diveDate: string;
    location: string;
    maxDepthM: number;
    bottomTimeMin: number;
}
