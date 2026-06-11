import type { Database } from '@repo/supabase';

type RegulatorRow = Database['public']['Tables']['regulators']['Row'];

/** レギュレーター機材 */
export interface Regulator {
    id: string;
    brand: string;
    model: string;
    purchasedOn: string | null;
    lastOverhauledOn: string;
    overhaulIntervalMonths: number;
    overhaulIntervalDives: number;
    isPrimary: boolean;
    notes: string | null;
    createdAt: string;
    updatedAt: string;
}

/** DB row → Regulator 変換 */
export const mapRegulator = (row: RegulatorRow): Regulator => ({
    id: row.id,
    brand: row.brand,
    model: row.model,
    purchasedOn: row.purchased_on,
    lastOverhauledOn: row.last_overhauled_on,
    overhaulIntervalMonths: row.overhaul_interval_months,
    overhaulIntervalDives: row.overhaul_interval_dives,
    isPrimary: row.is_primary,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
});
