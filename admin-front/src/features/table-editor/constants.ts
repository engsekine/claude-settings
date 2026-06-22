/**
 * 汎用テーブルエディタで扱える public テーブルの許可リスト（FR-017）。
 * 認証基盤（auth スキーマ）・管理者識別（admin_users）・監査ログ（admin_audit_logs）・
 * 専用画面を持つ主要エンティティ（users / dives / dive_sites）はここに含めない。
 */
export interface TableEditorConfig {
    /** 表示ラベル */
    label: string;
    /** キーワード検索対象カラム（許可リスト。空なら検索不可） */
    searchColumns: readonly string[];
    /** 並び替え許可カラム */
    sortableColumns: readonly string[];
    /** deleted_at を持つか */
    hasDeletedAt: boolean;
}

export const ALLOWED_TABLES = {
    user_details: {
        label: 'ユーザー詳細',
        searchColumns: ['nickname', 'last_name', 'first_name'],
        sortableColumns: ['created_at'],
        hasDeletedAt: false,
    },
    certifications: { label: '資格', searchColumns: [], sortableColumns: ['created_at'], hasDeletedAt: false },
    certification_tags: { label: '資格タグ', searchColumns: [], sortableColumns: [], hasDeletedAt: false },
    dive_plans: { label: 'ダイブプラン', searchColumns: [], sortableColumns: ['created_at'], hasDeletedAt: false },
    plan_packing_items: { label: '持ち物', searchColumns: [], sortableColumns: [], hasDeletedAt: false },
    regulators: { label: 'レギュレータ', searchColumns: [], sortableColumns: ['created_at'], hasDeletedAt: false },
} as const satisfies Record<string, TableEditorConfig>;

export type AllowedTable = keyof typeof ALLOWED_TABLES;

/** 許可リストに含まれるテーブルかを型ガードで判定する */
export const isAllowedTable = (name: string): name is AllowedTable => Object.hasOwn(ALLOWED_TABLES, name);
