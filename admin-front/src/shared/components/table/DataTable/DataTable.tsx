import type { ReactNode } from 'react';

import { cn } from '@/lib/cn';

import { EmptyState } from '../EmptyState';

export interface Column<Row> {
    /** 一意なカラムキー */
    key: string;
    /** ヘッダー表示名 */
    header: string;
    /** セルの描画 */
    cell: (row: Row) => ReactNode;
    className?: string;
}

interface DataTableProps<Row> {
    columns: Column<Row>[];
    rows: Row[];
    getRowKey: (row: Row) => string;
    /** 0 件時のメッセージ（FR-009） */
    emptyMessage?: string;
    /** スクリーンリーダー向けのテーブル説明 */
    caption: string;
}

/** 一覧テーブルの共通表示。0 件時は EmptyState を表示する（FR-009） */
export const DataTable = <Row,>({ columns, rows, getRowKey, emptyMessage, caption }: DataTableProps<Row>) => {
    if (rows.length === 0) {
        return <EmptyState message={emptyMessage} />;
    }

    return (
        <div className="overflow-x-auto rounded-md border">
            <table className="w-full text-sm">
                <caption className="sr-only">{caption}</caption>
                <thead className="bg-muted">
                    <tr>
                        {columns.map((column) => (
                            <th key={column.key} scope="col" className="px-4 py-2 text-left font-medium">
                                {column.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={getRowKey(row)} className="border-t hover:bg-muted/50">
                            {columns.map((column) => (
                                <td key={column.key} className={cn('px-4 py-2', column.className)}>
                                    {column.cell(row)}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};
