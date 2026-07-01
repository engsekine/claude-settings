'use server';

import { revalidatePath } from 'next/cache';

import { DEFAULT_PACKING_ITEMS } from '@/features/plans/lib/default-packing-items';
import type { PlanFormValues } from '@/features/plans/schemas/plan.schema';
import { requireUser } from '@/shared/lib/auth';
import { createClient } from '@/shared/lib/supabase/server';
import { type ActionResult, actionFailure, actionSuccess } from '@/shared/types/action-result';

/** PlanFormValues を DB の snake_case にマッピング */
const toDbRow = (input: PlanFormValues) => ({
    planned_on: input.plannedOn,
    location: input.location,
    notes: input.notes,
});

/** 予定関連の表示を再検証（一覧・詳細・TOP の「次の予定」カード） */
const revalidatePlanPaths = (id?: string) => {
    revalidatePath('/plans');
    if (id) revalidatePath(`/plans/${id}`);
    revalidatePath('/');
};

/**
 * 予定を作成し、デフォルト持ち物を一括展開する（FR-002 / FR-011）。
 * 持ち物の展開に失敗した場合は作成した予定を削除し、中途半端な状態を残さない。
 */
export const createPlan = async (input: PlanFormValues): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const { user, failure } = await requireUser(supabase);
    if (failure) return failure;

    const { data, error } = await supabase
        .from('dive_plans')
        .insert({ ...toDbRow(input), user_id: user.id })
        .select('id')
        .single();

    if (error || !data) {
        console.error('[createPlan] supabase error:', error);
        return actionFailure('予定の作成に失敗しました。時間をおいて再度お試しください');
    }

    const defaultItems = DEFAULT_PACKING_ITEMS.map((name, index) => ({
        plan_id: data.id,
        name,
        position: index,
    }));
    const { error: itemsError } = await supabase.from('plan_packing_items').insert(defaultItems);

    if (itemsError) {
        console.error('[createPlan] packing items error:', itemsError);
        await supabase.from('dive_plans').delete().eq('id', data.id);
        return actionFailure('予定の作成に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePlanPaths(data.id);
    return actionSuccess({ id: data.id });
};

/** 予定を更新する（FR-004） */
export const updatePlan = async (id: string, input: PlanFormValues): Promise<ActionResult> => {
    const supabase = await createClient();

    const { failure } = await requireUser(supabase);
    if (failure) return failure;

    const { error } = await supabase.from('dive_plans').update(toDbRow(input)).eq('id', id);

    if (error) {
        console.error('[updatePlan] supabase error:', error);
        return actionFailure('予定の更新に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePlanPaths(id);
    return actionSuccess();
};

/** 予定を削除する。持ち物は FK の on delete cascade で連動削除される（FR-004 / FR-014） */
export const deletePlan = async (id: string): Promise<ActionResult> => {
    const supabase = await createClient();

    const { failure } = await requireUser(supabase);
    if (failure) return failure;

    const { error } = await supabase.from('dive_plans').delete().eq('id', id);

    if (error) {
        console.error('[deletePlan] supabase error:', error);
        return actionFailure('予定の削除に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePlanPaths();
    return actionSuccess();
};

/** 持ち物項目のチェック状態を切り替える（FR-012） */
export const togglePackingItem = async (itemId: string, isChecked: boolean): Promise<ActionResult> => {
    const supabase = await createClient();

    const { failure } = await requireUser(supabase);
    if (failure) return failure;

    const { error } = await supabase.from('plan_packing_items').update({ is_checked: isChecked }).eq('id', itemId);

    if (error) {
        console.error('[togglePackingItem] supabase error:', error);
        return actionFailure('チェック状態の保存に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePlanPaths();
    return actionSuccess();
};

/** 持ち物のカスタム項目を末尾に追加する（FR-013） */
export const addPackingItem = async (planId: string, name: string): Promise<ActionResult<{ id: string }>> => {
    const supabase = await createClient();

    const { failure } = await requireUser(supabase);
    if (failure) return failure;

    const { data: last, error: lastError } = await supabase
        .from('plan_packing_items')
        .select('position')
        .eq('plan_id', planId)
        .order('position', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (lastError) {
        console.error('[addPackingItem] supabase error:', lastError);
        return actionFailure('項目の追加に失敗しました。時間をおいて再度お試しください');
    }

    const { data, error } = await supabase
        .from('plan_packing_items')
        .insert({ plan_id: planId, name, position: (last?.position ?? -1) + 1 })
        .select('id')
        .single();

    if (error || !data) {
        console.error('[addPackingItem] supabase error:', error);
        return actionFailure('項目の追加に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePlanPaths(planId);
    return actionSuccess({ id: data.id });
};

/** 持ち物項目を削除する（FR-013） */
export const deletePackingItem = async (itemId: string): Promise<ActionResult> => {
    const supabase = await createClient();

    const { failure } = await requireUser(supabase);
    if (failure) return failure;

    const { error } = await supabase.from('plan_packing_items').delete().eq('id', itemId);

    if (error) {
        console.error('[deletePackingItem] supabase error:', error);
        return actionFailure('項目の削除に失敗しました。時間をおいて再度お試しください');
    }

    revalidatePlanPaths();
    return actionSuccess();
};
