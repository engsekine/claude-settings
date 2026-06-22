import { notFound } from 'next/navigation';

import { ALLOWED_TABLES, type GenericRow, isAllowedTable, listTableRows } from '@/features/table-editor';
import { type Column, DataTable } from '@/shared/components/table/DataTable';
import { Pagination } from '@/shared/components/table/Pagination';
import { TableSearchBar } from '@/shared/components/table/TableSearchBar';
import { generatePageMetadata } from '@/shared/config/metadata';
import { DEFAULT_PER_PAGE, type RawSearchParams, firstParam, parsePage, parseSearch, parseSort } from '@/shared/lib/resource/params';

export const metadata = generatePageMetadata({
    slug: '/tables',
    title: 'テーブルエディタ',
    description: '汎用テーブルエディタ',
});

/** 1 行あたりに表示する最大カラム数（横幅の暴走を防ぐ） */
const MAX_COLUMNS = 8;

const formatCell = (value: unknown): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
};

const rowKey = (row: GenericRow): string => {
    const id = row['id'] ?? row['user_id'];
    return typeof id === 'string' ? id : JSON.stringify(row);
};

export default async function TableEditorPage({
    params,
    searchParams,
}: {
    params: Promise<{ table: string }>;
    searchParams: Promise<RawSearchParams>;
}) {
    const { table } = await params;
    if (!isAllowedTable(table)) notFound();

    const config = ALLOWED_TABLES[table];
    const sp = await searchParams;
    const page = parsePage(firstParam(sp, 'page'));
    const search = parseSearch(firstParam(sp, 'search'));
    const sort = parseSort(firstParam(sp, 'sort'), firstParam(sp, 'dir'), [...config.sortableColumns]);

    const { rows, total, perPage } = await listTableRows(table, { page, perPage: DEFAULT_PER_PAGE, search, sort });

    // 先頭行のキーから表示カラムを動的に決定する
    const keys = rows.length > 0 && rows[0] ? Object.keys(rows[0]).slice(0, MAX_COLUMNS) : [];
    const columns: Column<GenericRow>[] = keys.map((key) => ({
        key,
        header: key,
        cell: (row) => formatCell(row[key]),
    }));

    return (
        <div className="flex flex-col gap-4">
            <h1 className="font-semibold text-2xl">{config.label}</h1>
            {config.searchColumns.length > 0 && <TableSearchBar placeholder={`${config.label}を検索`} />}
            <DataTable
                caption={`${config.label}の一覧`}
                columns={columns}
                rows={rows}
                getRowKey={rowKey}
                emptyMessage="データがありません"
            />
            <Pagination page={page} perPage={perPage} total={total} />
        </div>
    );
}
