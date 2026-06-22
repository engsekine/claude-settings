import { requireAdmin } from '@/features/admin-auth';
import { listResource } from '@/shared/lib/resource/queries';
import type { ListParams, ResourceListResult } from '@/shared/lib/resource/types';
import { createClient } from '@/shared/lib/supabase/server';

/** 操作ログ一覧の 1 行（実行者名は admin_users から補完） */
export interface AuditLogRow {
    id: string;
    action: string;
    target_table: string;
    target_id: string;
    created_at: string;
    admin_users: { display_name: string } | null;
}

const LIST_COLUMNS = 'id, action, target_table, target_id, created_at, admin_users(display_name)';

/** 操作ログ一覧（時系列降順・管理者のみ / US5 / contracts/admin-audit.md） */
export const listAuditLogs = async (
    params: Pick<ListParams, 'page' | 'perPage'>,
): Promise<ResourceListResult<AuditLogRow>> => {
    await requireAdmin();
    const supabase = await createClient();

    return listResource<AuditLogRow>(supabase, 'admin_audit_logs', LIST_COLUMNS, {
        ...params,
        sort: { column: 'created_at', ascending: false },
        sortableColumns: ['created_at'],
        hasDeletedAt: false,
    });
};
