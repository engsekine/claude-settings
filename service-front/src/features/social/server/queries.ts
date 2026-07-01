import 'server-only';

import type { Database } from '@repo/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

import type {
    FollowListKind,
    FollowState,
    FollowUser,
    PublicProfile,
    TimelineCursor,
    TimelineItem,
    TimelinePage,
} from '@/features/social/types';
import { createClient } from '@/shared/lib/supabase/server';

type Client = SupabaseClient<Database>;

/** ダイブ公開一覧で取得する列（TimelineItem に対応） */
const PUBLIC_DIVE_COLUMNS = 'id, user_id, dive_date, location, max_depth_m, bottom_time_min';
const DEFAULT_PAGE_SIZE = 20;

/**
 * タイムラインで IN 句に載せるフォロー先の上限（spec 021 FR-021）。
 * フォロー数が多いユーザーでも PostgREST の URL 長制限に達しないよう、
 * 直近フォローした relationships を優先して絞る。超過分は console.warn で明示する。
 */
const MAX_TIMELINE_FOLLOWEES = 1000;

/** user_id 配列 → nickname の Map を get_user_public_profiles（SECURITY DEFINER）で解決する */
const resolveNicknames = async (supabase: Client, userIds: string[]): Promise<Map<string, string>> => {
    const unique = [...new Set(userIds)];
    const map = new Map<string, string>();
    if (unique.length === 0) return map;
    const { data, error } = await supabase.rpc('get_user_public_profiles', { p_ids: unique });
    if (error) throw new Error(`表示名の取得に失敗しました: ${error.message}`);
    for (const profile of data ?? []) map.set(profile.user_id, profile.nickname);
    return map;
};

/**
 * 対象ユーザーへのフォロー状態と件数（spec 021 FR-016）。
 * isFollowing は閲覧者（auth.uid）→ 対象、件数は対象を起点に集計する。
 */
export const fetchFollowState = async (targetUserId: string): Promise<FollowState> => {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const [followingState, followerCountRes, followingCountRes] = await Promise.all([
        user
            ? supabase
                  .from('user_follows')
                  .select('follower_id', { head: true, count: 'exact' })
                  .eq('follower_id', user.id)
                  .eq('followee_id', targetUserId)
            : Promise.resolve({ count: 0 }),
        supabase
            .from('user_follows')
            .select('followee_id', { head: true, count: 'exact' })
            .eq('followee_id', targetUserId),
        supabase
            .from('user_follows')
            .select('follower_id', { head: true, count: 'exact' })
            .eq('follower_id', targetUserId),
    ]);

    return {
        isFollowing: (followingState.count ?? 0) > 0,
        followerCount: followerCountRes.count ?? 0,
        followingCount: followingCountRes.count ?? 0,
    };
};

/**
 * フォロー一覧 / フォロワー一覧（spec 021 FR-016）。created_at 降順のキーセット。
 * 各行に閲覧者がフォロー中かを付与してリスト上のフォローボタンに使う。
 */
export const fetchFollowLists = async (
    userId: string,
    kind: FollowListKind,
    options: { limit?: number; cursor?: string | null } = {},
): Promise<{ items: FollowUser[]; nextCursor: string | null }> => {
    const supabase = await createClient();
    const { limit = DEFAULT_PAGE_SIZE, cursor } = options;
    const {
        data: { user },
    } = await supabase.auth.getUser();

    // following 一覧: 自分が follower の行を引き、相手 = followee_id。
    // followers 一覧: 自分が followee の行を引き、相手 = follower_id。
    // kind ごとに select を分けて、動的キーの unsafe cast を避けつつ相手 id を型安全に取り出す。
    const buildQuery = () => {
        const base =
            kind === 'following'
                ? supabase.from('user_follows').select('followee_id, created_at').eq('follower_id', userId)
                : supabase.from('user_follows').select('follower_id, created_at').eq('followee_id', userId);
        const ordered = base.order('created_at', { ascending: false }).limit(limit + 1);
        return cursor ? ordered.lt('created_at', cursor) : ordered;
    };

    const { data: rows, error } = await buildQuery();
    if (error) throw new Error(`フォロー一覧の取得に失敗しました: ${error.message}`);

    // kind に応じて相手 id と created_at を { targetId, createdAt } に正規化する
    const normalized = (rows ?? []).map((row) => ({
        targetId: 'followee_id' in row ? row.followee_id : row.follower_id,
        createdAt: row.created_at,
    }));

    const hasNext = normalized.length > limit;
    const pageRows = hasNext ? normalized.slice(0, limit) : normalized;
    const targetIds = pageRows.map((row) => row.targetId);

    const [nicknames, myFollowing] = await Promise.all([
        resolveNicknames(supabase, targetIds),
        // 閲覧者が targetIds の誰をフォロー中か（リストのフォローボタン用）
        user && targetIds.length > 0
            ? supabase
                  .from('user_follows')
                  .select('followee_id')
                  .eq('follower_id', user.id)
                  .in('followee_id', targetIds)
            : Promise.resolve({ data: [] as { followee_id: string }[] }),
    ]);
    const followingSet = new Set((myFollowing.data ?? []).map((row) => row.followee_id));

    const items: FollowUser[] = pageRows.map(({ targetId }) => ({
        userId: targetId,
        nickname: nicknames.get(targetId) ?? '（不明なユーザー）',
        isFollowing: followingSet.has(targetId),
    }));

    const lastCursor = hasNext ? (pageRows.at(-1)?.createdAt ?? null) : null;
    return { items, nextCursor: lastCursor };
};

/**
 * ユーザー検索（spec 021 / フォロー導線）。nickname 部分一致で他ユーザーを探す。
 * 呼び出し元自身は DB 関数側で除外。各行に閲覧者のフォロー状態を付与する。
 * 空クエリは即空配列。
 */
export const searchUsers = async (query: string): Promise<FollowUser[]> => {
    const trimmed = query.trim();
    if (trimmed.length === 0) return [];

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    const { data, error } = await supabase.rpc('search_users_by_nickname', { p_query: trimmed });
    if (error) throw new Error(`ユーザー検索に失敗しました: ${error.message}`);

    const results = data ?? [];
    const ids = results.map((row) => row.user_id);

    // 閲覧者が検索結果の誰をフォロー中か（一覧のフォローボタン用）
    const myFollowing =
        user && ids.length > 0
            ? await supabase
                  .from('user_follows')
                  .select('followee_id')
                  .eq('follower_id', user.id)
                  .in('followee_id', ids)
            : { data: [] as { followee_id: string }[] };
    const followingSet = new Set((myFollowing.data ?? []).map((row) => row.followee_id));

    return results.map((row) => ({
        userId: row.user_id,
        nickname: row.nickname,
        isFollowing: followingSet.has(row.user_id),
    }));
};

/**
 * 公開プロフィール（spec 021 US3）。nickname を解決し、存在しなければ null（→ 404）。
 * フォロー状態・件数も併せて返す。
 */
export const fetchPublicProfile = async (userId: string): Promise<PublicProfile | null> => {
    const supabase = await createClient();
    const nicknames = await resolveNicknames(supabase, [userId]);
    const nickname = nicknames.get(userId);
    if (!nickname) return null;

    const followState = await fetchFollowState(userId);
    return { userId, nickname, followState };
};

/** dives 行（公開一覧用）→ TimelineItem に変換（owner nickname は別途解決） */
const mapTimelineRow = (
    row: {
        id: string;
        user_id: string;
        dive_date: string;
        location: string | null;
        max_depth_m: number;
        bottom_time_min: number;
    },
    nicknames: Map<string, string>,
): TimelineItem => ({
    diveId: row.id,
    diveDate: row.dive_date,
    // location はサイト参照時 null。公開一覧/タイムラインではサイト名未結合のためフォールバック表示する
    location: row.location ?? '名称未設定',
    maxDepthM: Number(row.max_depth_m),
    bottomTimeMin: row.bottom_time_min,
    ownerId: row.user_id,
    ownerNickname: nicknames.get(row.user_id) ?? '（不明なユーザー）',
});

/**
 * 特定ユーザーの公開ログ一覧（spec 021 FR-015）。is_public=true のみ、(dive_date, id) キーセット。
 * RLS（authenticated can read public dives）により非公開は取得不可。
 */
export const fetchUserPublicDives = async (
    userId: string,
    options: { limit?: number; cursor?: TimelineCursor | null } = {},
): Promise<TimelinePage> => {
    const supabase = await createClient();
    const { limit = DEFAULT_PAGE_SIZE, cursor } = options;

    let query = supabase
        .from('dives')
        .select(PUBLIC_DIVE_COLUMNS)
        .eq('user_id', userId)
        .eq('is_public', true)
        .order('dive_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1);
    if (cursor)
        query = query.or(`dive_date.lt.${cursor.diveDate},and(dive_date.eq.${cursor.diveDate},id.lt.${cursor.id})`);

    const { data: rows, error } = await query;
    if (error) throw new Error(`公開ログの取得に失敗しました: ${error.message}`);

    const hasNext = (rows?.length ?? 0) > limit;
    const pageRows = (hasNext ? rows?.slice(0, limit) : rows) ?? [];
    const nicknames = await resolveNicknames(
        supabase,
        pageRows.map((row) => row.user_id),
    );
    const items = pageRows.map((row) => mapTimelineRow(row, nicknames));
    const last = pageRows.at(-1);
    const nextCursor = hasNext && last ? { diveDate: last.dive_date, id: last.id } : null;

    return { items, nextCursor };
};

/**
 * TOP タイムライン（spec 021 FR-017〜021）。
 * フォロー中ユーザーの公開ログを新しい順（dive_date, id キーセット）で取得する。
 * 未ログイン・フォロー 0 件は空。非公開は RLS により取得不可（二重防御）。
 */
export const fetchTimeline = async (
    options: { limit?: number; cursor?: TimelineCursor | null } = {},
): Promise<TimelinePage> => {
    const supabase = await createClient();
    const { limit = DEFAULT_PAGE_SIZE, cursor } = options;
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { items: [], nextCursor: null };

    // フォロー中の followee_id 集合を引く（0 件なら即空）。
    // フォロー数が多い場合は IN 句肥大化を避けるため直近フォロー順に上限で絞る（FR-021）。
    const { data: follows, error: followError } = await supabase
        .from('user_follows')
        .select('followee_id')
        .eq('follower_id', user.id)
        .order('created_at', { ascending: false })
        .limit(MAX_TIMELINE_FOLLOWEES + 1);
    if (followError) throw new Error(`フォロー情報の取得に失敗しました: ${followError.message}`);
    const allFolloweeIds = (follows ?? []).map((row) => row.followee_id);
    if (allFolloweeIds.length === 0) return { items: [], nextCursor: null };
    if (allFolloweeIds.length > MAX_TIMELINE_FOLLOWEES) {
        console.warn(
            `[fetchTimeline] フォロー数が上限(${MAX_TIMELINE_FOLLOWEES})を超えたため、直近フォロー分のみタイムラインに含めます`,
        );
    }
    const followeeIds = allFolloweeIds.slice(0, MAX_TIMELINE_FOLLOWEES);

    let query = supabase
        .from('dives')
        .select(PUBLIC_DIVE_COLUMNS)
        .in('user_id', followeeIds)
        .eq('is_public', true)
        .order('dive_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1);
    if (cursor)
        query = query.or(`dive_date.lt.${cursor.diveDate},and(dive_date.eq.${cursor.diveDate},id.lt.${cursor.id})`);

    const { data: rows, error } = await query;
    if (error) throw new Error(`タイムラインの取得に失敗しました: ${error.message}`);

    const hasNext = (rows?.length ?? 0) > limit;
    const pageRows = (hasNext ? rows?.slice(0, limit) : rows) ?? [];
    const nicknames = await resolveNicknames(
        supabase,
        pageRows.map((row) => row.user_id),
    );
    const items = pageRows.map((row) => mapTimelineRow(row, nicknames));
    const last = pageRows.at(-1);
    const nextCursor = hasNext && last ? { diveDate: last.dive_date, id: last.id } : null;

    return { items, nextCursor };
};
