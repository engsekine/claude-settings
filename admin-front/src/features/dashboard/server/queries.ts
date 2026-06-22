import { requireAdmin } from '@/features/admin-auth';
import { createClient } from '@/shared/lib/supabase/server';

/** ダッシュボードの主要 KPI */
export interface DashboardKpis {
    userCount: number;
    diveCount: number;
    diveSiteCount: number;
}

/** 登録ユーザー数・ダイブログ総数・ダイブサイト数を集計する（US4 / SC-004 を意識し count head のみ） */
export const getDashboardKpis = async (): Promise<DashboardKpis> => {
    await requireAdmin();
    const supabase = await createClient();

    const [users, dives, sites] = await Promise.all([
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('dives').select('id', { count: 'exact', head: true }).is('deleted_at', null),
        supabase.from('dive_sites').select('id', { count: 'exact', head: true }).is('deleted_at', null),
    ]);

    if (users.error) throw users.error;
    if (dives.error) throw dives.error;
    if (sites.error) throw sites.error;

    return {
        userCount: users.count ?? 0,
        diveCount: dives.count ?? 0,
        diveSiteCount: sites.count ?? 0,
    };
};
