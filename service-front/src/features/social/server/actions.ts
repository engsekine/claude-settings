'use server';

import { revalidatePath } from 'next/cache';

import { requireUser } from '@/shared/lib/auth';
import { createClient } from '@/shared/lib/supabase/server';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

/** Postgres ユニーク制約違反のエラーコード（重複フォロー） */
const PG_UNIQUE_VIOLATION = '23505';

/**
 * 対象ユーザーをフォローする（spec 021 FR-012）。承認不要の一方向。
 * follower は常に auth.uid（クライアント値を信用しない）。重複は冪等成功に変換。
 */
export const followUser = async (followeeId: string): Promise<ActionResult<{ isFollowing: true }>> => {
    const supabase = await createClient();

    const { user, failure } = await requireUser(supabase);
    if (failure) return failure;
    if (user.id === followeeId) return actionFailure('自分自身はフォローできません');

    const { error } = await supabase.from('user_follows').insert({ follower_id: user.id, followee_id: followeeId });

    // 既にフォロー中（PK 重複）は冪等成功として扱う
    if (error && error.code !== PG_UNIQUE_VIOLATION) {
        console.error('[followUser] supabase error:', error);
        return actionFailure('フォローに失敗しました。時間をおいて再度お試しください');
    }

    revalidatePath(`/users/${followeeId}`);
    return actionSuccess({ isFollowing: true });
};

/** フォローを解除する（spec 021 FR-013）。未フォローでも冪等成功。 */
export const unfollowUser = async (followeeId: string): Promise<ActionResult<{ isFollowing: false }>> => {
    const supabase = await createClient();

    const { user, failure } = await requireUser(supabase);
    if (failure) return failure;

    const { error } = await supabase
        .from('user_follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('followee_id', followeeId);

    if (error) {
        console.error('[unfollowUser] supabase error:', error);
        return actionFailure('フォロー解除に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePath(`/users/${followeeId}`);
    return actionSuccess({ isFollowing: false });
};

/**
 * バディとしてタグ付けされた本人が、自分宛のタグを除去する（spec 021 FR-024a）。
 * removed_by_buddy=true へのソフト除去。RLS "buddy can opt out own tag" により
 * 自分宛（buddy_user_id = auth.uid()）のタグのみ更新でき、除去後は所有者も削除・再タグ付け不可（FR-024b）。
 */
export const removeBuddyTagOfSelf = async (buddyTagId: string): Promise<ActionResult> => {
    const supabase = await createClient();

    const { user, failure } = await requireUser(supabase);
    if (failure) return failure;

    const { data, error } = await supabase
        .from('dive_log_buddies')
        .update({ removed_by_buddy: true })
        .eq('id', buddyTagId)
        .eq('buddy_user_id', user.id)
        .select('dive_id')
        .maybeSingle();

    if (error) {
        console.error('[removeBuddyTagOfSelf] supabase error:', error);
        return actionFailure('タグの除去に失敗しました。時間をおいて再度お試しください');
    }
    if (!data) return actionFailure('対象のタグが見つかりません');

    revalidatePath(`/dives/${data.dive_id}`);
    return actionSuccess();
};
