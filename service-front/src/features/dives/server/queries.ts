import 'server-only';

import { DIVE_PAGE_SIZE } from '@/features/dives/constants';
import type { Dive, DiveCursor, DiveListFilter, DiveListItem, DiveListPage } from '@/features/dives/types';
import { createClient } from '@/shared/lib/supabase/server';

/** DB レコードを Dive 型に変換 */
type DiveRow = {
    id: string;
    user_id: string;
    dive_number: number | null;
    dive_date: string;
    entry_time: string | null;
    exit_time: string | null;
    location: string;
    country: string | null;
    dive_site: string | null;
    dive_type: string | null;
    weather: string | null;
    air_temp_c: number | string | null;
    water_temp_c: number | string | null;
    visibility_m: number | string | null;
    wave: string | null;
    current_condition: string | null;
    max_depth_m: number | string;
    avg_depth_m: number | string | null;
    bottom_time_min: number;
    surface_interval_min: number | null;
    tank_type: string | null;
    tank_volume_l: number | string | null;
    gas_type: string | null;
    o2_percent: number | string | null;
    pressure_start_bar: number | null;
    pressure_end_bar: number | null;
    weight_kg: number | string | null;
    suit_type: string | null;
    equipment_notes: string | null;
    buddy_name: string | null;
    instructor_name: string | null;
    certification_dive: boolean;
    notes: string | null;
    is_public: boolean;
    public_slug: string | null;
    created_at: string;
    updated_at: string;
};

const toNumber = (value: number | string | null): number | null => {
    if (value === null) return null;
    return typeof value === 'number' ? value : Number(value);
};

const mapDive = (row: DiveRow): Dive => ({
    id: row.id,
    userId: row.user_id,
    diveNumber: row.dive_number,
    diveDate: row.dive_date,
    entryTime: row.entry_time,
    exitTime: row.exit_time,
    location: row.location,
    country: row.country,
    diveSite: row.dive_site,
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
    surfaceIntervalMin: row.surface_interval_min,
    tankType: row.tank_type,
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

type DiveListRow = Pick<
    DiveRow,
    | 'id'
    | 'dive_number'
    | 'dive_date'
    | 'location'
    | 'dive_site'
    | 'max_depth_m'
    | 'bottom_time_min'
    | 'water_temp_c'
    | 'visibility_m'
    | 'certification_dive'
>;

const LIST_COLUMNS =
    'id, dive_number, dive_date, location, dive_site, max_depth_m, bottom_time_min, water_temp_c, visibility_m, certification_dive';

const mapDiveListItem = (row: DiveListRow): DiveListItem => ({
    id: row.id,
    diveNumber: row.dive_number,
    diveDate: row.dive_date,
    location: row.location,
    diveSite: row.dive_site,
    maxDepthM: Number(row.max_depth_m),
    bottomTimeMin: row.bottom_time_min,
    waterTempC: toNumber(row.water_temp_c),
    visibilityM: toNumber(row.visibility_m),
    certificationDive: row.certification_dive,
});

export interface ListDivesOptions {
    filter?: DiveListFilter;
    cursor?: DiveCursor;
    limit?: number;
}

/**
 * 自分の dives を日付降順で取得。
 * キーセットページネーション（(dive_date, id) の複合カーソル）対応。
 */
export const listDives = async (options: ListDivesOptions = {}): Promise<DiveListPage> => {
    const { filter, cursor, limit = DIVE_PAGE_SIZE } = options;
    const supabase = await createClient();

    let query = supabase
        .from('dives')
        .select(LIST_COLUMNS)
        .order('dive_date', { ascending: false })
        .order('id', { ascending: false })
        .limit(limit + 1);

    if (filter?.dateFrom) query = query.gte('dive_date', filter.dateFrom);
    if (filter?.dateTo) query = query.lte('dive_date', filter.dateTo);
    if (filter?.location) query = query.ilike('location', `%${filter.location}%`);

    if (cursor) {
        /** (dive_date, id) の降順タプル比較を or で表現 */
        query = query.or(`dive_date.lt.${cursor.diveDate},and(dive_date.eq.${cursor.diveDate},id.lt.${cursor.id})`);
    }

    const { data, error } = await query;

    if (error || !data) {
        console.error('[listDives] supabase error:', error);
        return { items: [], nextCursor: null };
    }

    const rows = data as DiveListRow[];
    const hasNext = rows.length > limit;
    const items = (hasNext ? rows.slice(0, limit) : rows).map(mapDiveListItem);

    const last = items.at(-1);
    const nextCursor = hasNext && last ? { diveDate: last.diveDate, id: last.id } : null;

    return { items, nextCursor };
};

/** 自分の dive を 1 件取得。RLS により他人のレコードは null になる */
export const getDive = async (id: string): Promise<Dive | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase.from('dives').select('*').eq('id', id).maybeSingle();

    if (error) {
        console.error('[getDive] supabase error:', error);
        return null;
    }
    if (!data) return null;

    return mapDive(data as DiveRow);
};
