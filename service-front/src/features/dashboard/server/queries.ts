import 'server-only';

import { calcBlankDays } from '@/features/dashboard/lib/blankDays';
import { calcOverhaulStatus } from '@/features/dashboard/lib/overhaul';
import type { DashboardHero, DiveStats, PrimaryRegulatorStatus } from '@/features/dashboard/types';
import { todayInJst } from '@/shared/lib/date';
import { toNumber } from '@/shared/lib/number';
import { createClient } from '@/shared/lib/supabase/server';

/** 累計統計を DB 側集計（RPC get_dive_stats）で取得する（FR-003） */
export const getDiveStats = async (): Promise<DiveStats> => {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_dive_stats').single();

    if (error || !data) {
        throw new Error(`[getDiveStats] supabase error: ${error?.message ?? 'no data'}`);
    }

    return {
        totalDives: Number(data.total_dives),
        totalBottomTimeMin: Number(data.total_bottom_time_min),
        maxDepthM: toNumber(data.max_depth_m) ?? 0,
        visitedLocations: Number(data.visited_locations),
    };
};

/**
 * メイン機材（is_primary = true）の OH ステータスを取得する（FR-012 / FR-014）。
 * レギュレーター未登録は null（TOP 側で登録 CTA を表示）。
 */
export const getPrimaryRegulatorStatus = async (): Promise<PrimaryRegulatorStatus | null> => {
    const supabase = await createClient();

    const { data: regulator, error } = await supabase
        .from('regulators')
        .select('id, brand, model, last_overhauled_on, overhaul_interval_months, overhaul_interval_dives')
        .eq('is_primary', true)
        .maybeSingle();

    if (error) {
        throw new Error(`[getPrimaryRegulatorStatus] supabase error: ${error.message}`);
    }
    if (!regulator) return null;

    const { count, error: countError } = await supabase
        .from('dives')
        .select('id', { count: 'exact', head: true })
        .gte('dive_date', regulator.last_overhauled_on);

    if (countError) {
        throw new Error(`[getPrimaryRegulatorStatus] supabase error: ${countError.message}`);
    }

    const status = calcOverhaulStatus({
        lastOverhauledOn: regulator.last_overhauled_on,
        intervalMonths: regulator.overhaul_interval_months,
        intervalDives: regulator.overhaul_interval_dives,
        divesSinceLastOverhaul: count ?? 0,
        today: todayInJst(),
    });

    return {
        regulatorId: regulator.id,
        brand: regulator.brand,
        model: regulator.model,
        lastOverhauledOn: regulator.last_overhauled_on,
        status,
    };
};

/** ヒーロー用データ（表示名 + ブランク日数）を取得する（FR-002） */
export const getDashboardHero = async (): Promise<DashboardHero> => {
    const supabase = await createClient();

    const [detailsResult, lastDiveResult] = await Promise.all([
        supabase.from('user_details').select('nickname').maybeSingle(),
        supabase.from('dives').select('dive_date').order('dive_date', { ascending: false }).limit(1).maybeSingle(),
    ]);

    if (detailsResult.error) {
        throw new Error(`[getDashboardHero] supabase error: ${detailsResult.error.message}`);
    }
    if (lastDiveResult.error) {
        throw new Error(`[getDashboardHero] supabase error: ${lastDiveResult.error.message}`);
    }

    const lastDiveOn = lastDiveResult.data?.dive_date ?? null;

    return {
        nickname: detailsResult.data?.nickname ?? null,
        blankDays: calcBlankDays(lastDiveOn, todayInJst()),
    };
};
