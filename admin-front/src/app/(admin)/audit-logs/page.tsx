import { type AuditLogRow, listAuditLogs } from '@/features/audit-log';
import { type Column, DataTable } from '@/shared/components/table/DataTable';
import { Pagination } from '@/shared/components/table/Pagination';
import { generatePageMetadata } from '@/shared/config/metadata';
import { DEFAULT_PER_PAGE, type RawSearchParams, firstParam, parsePage } from '@/shared/lib/resource/params';

export const metadata = generatePageMetadata({
    slug: '/audit-logs',
    title: '操作ログ',
    description: '管理画面の操作履歴',
});

const ACTION_LABEL: Record<string, string> = {
    create: '作成',
    update: '更新',
    soft_delete: '削除',
    hard_delete: '物理削除',
    restore: '復元',
};

export default async function AuditLogsPage({ searchParams }: { searchParams: Promise<RawSearchParams> }) {
    const sp = await searchParams;
    const page = parsePage(firstParam(sp, 'page'));

    const { rows, total, perPage } = await listAuditLogs({ page, perPage: DEFAULT_PER_PAGE });

    const columns: Column<AuditLogRow>[] = [
        { key: 'created_at', header: '日時', cell: (row) => new Date(row.created_at).toLocaleString('ja-JP') },
        { key: 'actor', header: '実行者', cell: (row) => row.admin_users?.display_name ?? '-' },
        { key: 'action', header: '操作', cell: (row) => ACTION_LABEL[row.action] ?? row.action },
        { key: 'target', header: '対象', cell: (row) => `${row.target_table} : ${row.target_id}` },
    ];

    return (
        <div className="flex flex-col gap-4">
            <h1 className="font-semibold text-2xl">操作ログ</h1>
            <DataTable
                caption="操作ログ一覧"
                columns={columns}
                rows={rows}
                getRowKey={(row) => row.id}
                emptyMessage="操作ログがありません"
            />
            <Pagination page={page} perPage={perPage} total={total} />
        </div>
    );
}
