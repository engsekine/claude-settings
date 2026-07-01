/**
 * social feature のドメイン型（spec 021）。
 * DB スキーマ（snake_case）はマッピング層で camelCase に変換する。
 */

/** あるユーザーに対するフォロー状態と件数 */
export interface FollowState {
    /** 閲覧者が対象ユーザーをフォロー中か */
    isFollowing: boolean;
    /** 対象ユーザーのフォロワー数 */
    followerCount: number;
    /** 対象ユーザーがフォローしている数 */
    followingCount: number;
}

/** フォロー一覧 / フォロワー一覧の 1 ユーザー行 */
export interface FollowUser {
    userId: string;
    nickname: string;
    /** 閲覧者がこのユーザーをフォロー中か（一覧上のフォローボタン用） */
    isFollowing: boolean;
}

/** タイムライン / 公開ログ一覧の 1 項目（公開ダイブログの要約 + 所有者） */
export interface TimelineItem {
    diveId: string;
    /** ISO 8601 date (YYYY-MM-DD) */
    diveDate: string;
    location: string;
    maxDepthM: number;
    bottomTimeMin: number;
    ownerId: string;
    ownerNickname: string;
}

/** キーセットページネーション用カーソル（dive_date desc, id desc） */
export interface TimelineCursor {
    diveDate: string;
    id: string;
}

/** タイムライン / 公開ログ一覧の 1 ページ */
export interface TimelinePage {
    items: TimelineItem[];
    nextCursor: TimelineCursor | null;
}

/** 公開プロフィール（プロフィールページの表示モデル） */
export interface PublicProfile {
    userId: string;
    nickname: string;
    followState: FollowState;
}

/** フォロー一覧の種別 */
export type FollowListKind = 'following' | 'followers';
