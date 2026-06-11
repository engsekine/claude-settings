import 'server-only';

import { mapRegulator, type Regulator } from '@/features/regulators/types';
import { createClient } from '@/shared/lib/supabase/server';

/** 自分のレギュレーター一覧（メイン機材が先頭、以降は作成日昇順）（FR-006） */
export const listRegulators = async (): Promise<Regulator[]> => {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('regulators')
        .select('*')
        .order('is_primary', { ascending: false })
        .order('created_at', { ascending: true });

    if (error || !data) {
        throw new Error(`[listRegulators] supabase error: ${error?.message ?? 'no data'}`);
    }

    return data.map(mapRegulator);
};

/** 自分のレギュレーターを 1 件取得。データなし（RLS 含む）は null（404 セマンティクス） */
export const getRegulator = async (id: string): Promise<Regulator | null> => {
    const supabase = await createClient();

    const { data, error } = await supabase.from('regulators').select('*').eq('id', id).maybeSingle();

    if (error) {
        throw new Error(`[getRegulator] supabase error: ${error.message}`);
    }

    return data ? mapRegulator(data) : null;
};
