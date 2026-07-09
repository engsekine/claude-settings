import type { Database } from '@repo/supabase';

type DivePlanRow = Database['public']['Tables']['dive_plans']['Row'];
type PackingItemRow = Database['public']['Tables']['plan_packing_items']['Row'];

/** ダイビング予定 */
export interface Plan {
    id: string;
    plannedOn: string;
    location: string;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

/** 持ち物項目 */
export interface PackingItem {
    id: string;
    name: string;
    isChecked: boolean;
    position: number;
}

/** 予定詳細（持ち物込み） */
export interface PlanWithPacking extends Plan {
    packingItems: PackingItem[];
}

/** TOP「次の予定」カード用サマリー */
export interface NextPlanSummary {
    id: string;
    plannedOn: string;
    location: string;
    /** 予定メモ。未入力は null */
    notes: string | null;
    /** 今日 = 0、未来 = 正の値 */
    daysUntil: number;
    /** 持ち物（表示順）。カード上でチェック操作するため全件持つ */
    packingItems: PackingItem[];
}

/** DB row → Plan 変換 */
export const mapPlan = (row: DivePlanRow): Plan => ({
    id: row.id,
    plannedOn: row.planned_on,
    location: row.location,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

/** DB row → PackingItem 変換 */
export const mapPackingItem = (row: PackingItemRow): PackingItem => ({
    id: row.id,
    name: row.name,
    isChecked: row.is_checked,
    position: row.position,
});
