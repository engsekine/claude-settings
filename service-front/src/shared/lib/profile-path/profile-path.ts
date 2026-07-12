/**
 * プロフィール URL の判定・生成の唯一の情報源（034 / research.md Decision 3）。
 * リンク生成（features 各所）・ルートの slug 判別（users/[slug]）・
 * ニックネームの登録禁則（shared/schemas/user-profile）がすべてここを参照する。
 */

/** `/users/` 配下でプロフィール以外に使う予約セグメント。ニックネームとして登録も解決もしない */
export const RESERVED_USER_SEGMENTS = ['search'] as const;

/**
 * URL の判別・エンコードを壊すためニックネームに使えない文字（FR-006）。
 * `/`（パス区切り）・`?` `#`（クエリ/フラグメント）・`%`（エンコード衝突）・`\`・制御文字。
 */
// biome-ignore lint/suspicious/noControlCharactersInRegex: 制御文字の拒否が目的のため意図的に含める
export const NICKNAME_FORBIDDEN_PATTERN = /[/?#%\\\u0000-\u001f\u007f]/;

/** uuid 形式（ID とニックネームの判別基準。大文字小文字問わず） */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string): boolean => UUID_PATTERN.test(value);

/**
 * ニックネームがプロフィール URL のセグメントとして使えるか（FR-005/006）。
 * 予約セグメントは一意制約と同じ正規化（小文字化・前後空白除去）で比較する。
 */
export const isUrlSafeNickname = (nickname: string): boolean => {
    const normalized = nickname.trim().toLowerCase();
    if (normalized === '') return false;
    if (NICKNAME_FORBIDDEN_PATTERN.test(nickname)) return false;
    if ((RESERVED_USER_SEGMENTS as readonly string[]).includes(normalized)) return false;
    if (isUuid(normalized)) return false;
    return true;
};

interface ProfilePathInput {
    userId: string;
    /** 表示用に取得済みのニックネーム。未取得・URL 不可のときは ID URL にフォールバックする */
    nickname?: string | null | undefined;
}

/** プロフィール URL を生成する（FR-003/005）。ID URL はページ側でニックネーム URL へ転送される */
export const profilePath = ({ userId, nickname }: ProfilePathInput): string => {
    if (nickname && isUrlSafeNickname(nickname)) {
        return `/users/${encodeURIComponent(nickname)}`;
    }
    return `/users/${userId}`;
};
