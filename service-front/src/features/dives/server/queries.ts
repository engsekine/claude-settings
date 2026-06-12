import 'server-only';

import type { Database } from '@repo/supabase';

import type { TankTypeValue } from '@/features/dives/constants';
import { fetchDiveListPage } from '@/features/dives/lib/list-query';
import type { Dive, DiveCursor, DiveListFilter, DiveListPage } from '@/features/dives/types';
import { toNumber } from '@/shared/lib/number';
import { createClient } from '@/shared/lib/supabase/server';

type DiveRow = Database['public']['Tables']['dives']['Row'];

/**
 * DB の snake_case 行をドメイン型 Dive に変換する。
 * numeric カラムは Supabase 経由で string になることがあるため数値へ正規化する。
 */
const mapDive = (row: DiveRow): Dive => ({
    id: row.id,
    userId: row.user_id,
    diveNumber: row.dive_number,
    diveDate: row.dive_date,
    entryTime: row.entry_time,
    exitTime: row.exit_time,
    location: row.location,
    diveType: row.dive_type,
    weather: row.weather,
    airTempC: toNumber(row.air_temp_c),
    waterTempC: toNumber(row.water_temp_c),
    visibilityM: toNumber(row.visibility_m),
    wave: row.wave,
    currentCondition: row.current_condition,
    maxDepthM: Number(row.max_depth_m),
    avgDepthM: toNumber(row.avg_depth_m),
    bottomTimeMin: row.bottom_time_min,
    // DB 側は CHECK 制約で選択肢を保証しているため、ここでは型を狭めるだけ
    tankType: row.tank_type as TankTypeValue | null,
    tankVolumeL: toNumber(row.tank_volume_l),
    gasType: row.gas_type,
    o2Percent: toNumber(row.o2_percent),
    pressureStartBar: row.pressure_start_bar,
    pressureEndBar: row.pressure_end_bar,
    weightKg: toNumber(row.weight_kg),
    suitType: row.suit_type,
    equipmentNotes: row.equipment_notes,
    buddyName: row.buddy_name,
    instructorName: row.instructor_name,
    certificationDive: row.certification_dive,
    notes: row.notes,
    isPublic: row.is_public,
    publicSlug: row.public_slug,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});

export interface ListDivesOptions {
    filter?: DiveListFilter;
    cursor?: DiveCursor;
    limit?: number;
}

/**
 * 自分の dives を日付降順で取得。
 * キーセットページネーション（(dive_date, id) の複合カーソル）対応。
 * Supabase エラー時は throw し、Next.js の error.tsx に委ねる。
 */
export const listDives = async (options: ListDivesOptions = {}): Promise<DiveListPage> => {
    const supabase = await createClient();
    return fetchDiveListPage(supabase, options);
};

/**
 * 自分の dives の中で最大の dive_number を取得する。
 * 一度も dive_number を入力していない / ログがない場合は null を返す。
 * 新規作成画面で「前回の番号 + 1」を初期値として提示するために使う。
 */
export const getLatestDiveNumber = async (): Promise<number | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('dives')
        .select('dive_number')
        .not('dive_number', 'is', null)
        .order('dive_number', { ascending: false })
        .limit(1)
        .maybeSingle();

    if (error) throw new Error(`dive_number の取得に失敗しました: ${error.message}`);

    return data?.dive_number ?? null;
};

/** 自分の dive を 1 件取得。データなし（RLS により他人のレコードを含む）は null を返す */
export const getDive = async (id: string): Promise<Dive | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase.from('dives').select('*').eq('id', id).maybeSingle();

    if (error) throw new Error(`dive の取得に失敗しました: ${error.message}`);
    if (!data) return null;

    return mapDive(data);
};

/** 他機能からの紐づけ選択用に最小限の項目だけ持つダイブの要約 */
export interface DiveOption {
    id: string;
    /** ダイブ日（YYYY-MM-DD） */
    diveDate: string;
    location: string;
}

/**
 * 自分の全 dives を選択肢用に日付降順で取得する（id / 日付 / ポイント名のみ）。
 * 資格の「取得ダイブ」セレクトなど、他機能がページ層で合成して使う想定
 */
export const listDiveOptions = async (): Promise<DiveOption[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('dives')
        .select('id, dive_date, location')
        .order('dive_date', { ascending: false })
        .order('created_at', { ascending: false });

    if (error || !data) {
        throw new Error(`[listDiveOptions] supabase error: ${error?.message ?? 'no data'}`);
    }

    return data.map((row) => ({ id: row.id, diveDate: row.dive_date, location: row.location }));
};
