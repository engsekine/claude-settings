import 'server-only';

import { daysUntil } from '@/features/plans/lib/days-until';
import { mapPackingItem, mapPlan, type NextPlanSummary, type Plan, type PlanWithPacking } from '@/features/plans/types';
import { todayInJst } from '@/shared/lib/date';
import { createClient } from '@/shared/lib/supabase/server';

/**
 * 自分の予定を予定日昇順で全件取得（FR-001）。
 * 件数はユーザーあたり高々数十件想定のためページネーションしない（research.md Decision 1）。
 */
export const listPlans = async (): Promise<Plan[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('dive_plans')
        .select('*')
        .order('planned_on', { ascending: true })
        .order('created_at', { ascending: false });

    if (error || !data) {
        throw new Error(`[listPlans] supabase error: ${error?.message ?? 'no data'}`);
    }

    return data.map(mapPlan);
};

/** 自分の予定を持ち物込みで 1 件取得。データなし（RLS 含む）は null（404 セマンティクス） */
export const getPlan = async (id: string): Promise<PlanWithPacking | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('dive_plans')
        .select('*, plan_packing_items(*)')
        .eq('id', id)
        .maybeSingle();

    if (error) {
        throw new Error(`[getPlan] supabase error: ${error.message}`);
    }
    if (!data) return null;

    const { plan_packing_items: itemRows, ...planRow } = data;
    const packingItems = [...itemRows].sort((a, b) => a.position - b.position).map(mapPackingItem);

    return { ...mapPlan(planRow), packingItems };
};

/**
 * TOP「次の予定」カード用: 最も近い未来（今日含む）の予定 + 持ち物進捗（FR-007 / FR-009)。
 * 同日複数は作成日時が新しい方を優先（spec Edge Case）。予定なしは null。
 * 進捗は都度集計する（research.md Decision 6）。
 */
export const getNextPlanWithProgress = async (): Promise<NextPlanSummary | null> => {
    const supabase = await createClient();
    const today = todayInJst();

    const { data, error } = await supabase
        .from('dive_plans')
        .select('id, planned_on, location, plan_packing_items(is_checked)')
        .gte('planned_on', today)
        .order('planned_on', { ascending: true })
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) {
        throw new Error(`[getNextPlanWithProgress] supabase error: ${error.message}`);
    }
    if (!data) return null;

    return {
        id: data.id,
        plannedOn: data.planned_on,
        location: data.location,
        daysUntil: daysUntil(data.planned_on, today),
        checkedCount: data.plan_packing_items.filter((item) => item.is_checked).length,
        totalCount: data.plan_packing_items.length,
    };
};
