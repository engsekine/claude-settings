'use server';

import { revalidatePath } from 'next/cache';

import { createClient } from '@/shared/lib/supabase/server';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

/**
 * バディとしてタグ付けされた本人が、自分宛のタグを除去する（spec 021 FR-024a）。
 * removed_by_buddy=true へのソフト除去。RLS "buddy can opt out own tag" により
 * 自分宛（buddy_user_id = auth.uid()）のタグのみ更新でき、除去後は所有者も削除・再タグ付け不可（FR-024b）。
 */
export const removeBuddyTagOfSelf = async (buddyTagId: string): Promise<ActionResult> => {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return actionFailure('ログインが必要です');

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
