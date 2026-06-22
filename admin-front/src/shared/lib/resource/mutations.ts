import type { Database } from '@repo/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

import { recordAudit } from '@/shared/lib/audit/recordAudit';

type AdminClient = SupabaseClient<Database>;
type PublicTable = keyof Database['public']['Tables'] & string;
type RowValues = Record<string, unknown>;

/**
 * 動的テーブル名（実行時に決まる）は生成型では表現できず、型付きクライアントだと
 * チェーンが never に潰れる。この 1 箇所だけ緩い型に落として境界を閉じ込める。
 * テーブル許可リスト（呼び出し側）と DB の RLS/制約で実行時の安全性を担保する。
 */
// biome-ignore lint/suspicious/noExplicitAny: 動的テーブルアクセスの型境界
type LooseClient = { from: (table: string) => any };
const loose = (supabase: AdminClient): LooseClient => supabase as unknown as LooseClient;

/** 楽観ロック競合（他の管理者が更新済み / FR-022） */
export class OptimisticLockError extends Error {
    constructor() {
        super('optimistic lock conflict');
        this.name = 'OptimisticLockError';
    }
}

/** 参照されているため削除できない（FR-014） */
export class ReferencedError extends Error {
    constructor(public readonly count: number) {
        super(`referenced by ${count} rows`);
        this.name = 'ReferencedError';
    }
}

/** 新規作成 + 監査記録。作成した行の id を返す */
export const insertRow = async (
    supabase: AdminClient,
    table: PublicTable,
    values: RowValues,
    actorId: string,
): Promise<string> => {
    const { data, error } = await loose(supabase).from(table).insert(values).select('id').single();
    if (error) throw error;
    const id = String(data.id);
    await recordAudit(supabase, actorId, { action: 'create', targetTable: table, targetId: id, changes: values });
    return id;
};

/**
 * 更新 + 監査記録。楽観ロック: expectedUpdatedAt が現在値と異なれば
 * OptimisticLockError を投げる（無警告の後勝ち上書きを防ぐ / FR-022）。
 */
export const updateRow = async (
    supabase: AdminClient,
    table: PublicTable,
    id: string,
    values: RowValues,
    expectedUpdatedAt: string,
    actorId: string,
): Promise<void> => {
    // 監査用に変更前のスナップショットを取得する
    const { data: before, error: fetchError } = await loose(supabase)
        .from(table)
        .select('*')
        .eq('id', id)
        .maybeSingle();
    if (fetchError) throw fetchError;
    if (!before) throw new Error('対象が見つかりません');

    // 楽観ロックは UPDATE の WHERE 句（updated_at = expected）で原子的に担保する。
    // SELECT→UPDATE 間に別管理者が更新しても WHERE が一致せず 0 件になり、後勝ちを防ぐ（FR-022 / TOCTOU 回避）。
    const { data: updated, error } = await loose(supabase)
        .from(table)
        .update(values)
        .eq('id', id)
        .eq('updated_at', expectedUpdatedAt)
        .select('id');
    if (error) throw error;
    if (!updated || updated.length === 0) throw new OptimisticLockError();

    await recordAudit(supabase, actorId, {
        action: 'update',
        targetTable: table,
        targetId: id,
        changes: { before, after: values },
    });
};

/** ソフトデリート（deleted_at = now()）+ 監査記録 */
export const softDeleteRow = async (
    supabase: AdminClient,
    table: PublicTable,
    id: string,
    actorId: string,
): Promise<void> => {
    const { error } = await loose(supabase).from(table).update({ deleted_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
    await recordAudit(supabase, actorId, { action: 'soft_delete', targetTable: table, targetId: id });
};

/** 復元（deleted_at = null）+ 監査記録 */
export const restoreRow = async (
    supabase: AdminClient,
    table: PublicTable,
    id: string,
    actorId: string,
): Promise<void> => {
    const { error } = await loose(supabase).from(table).update({ deleted_at: null }).eq('id', id);
    if (error) throw error;
    await recordAudit(supabase, actorId, { action: 'restore', targetTable: table, targetId: id });
};

/**
 * 物理削除 + 監査記録。referencingCount > 0 の場合は ReferencedError を投げて
 * 削除をブロックする（FR-014。連鎖削除・参照解除はしない）。
 */
export const hardDeleteRow = async (
    supabase: AdminClient,
    table: PublicTable,
    id: string,
    actorId: string,
    referencingCount: number,
): Promise<void> => {
    if (referencingCount > 0) throw new ReferencedError(referencingCount);

    const { error } = await loose(supabase).from(table).delete().eq('id', id);
    if (error) throw error;
    await recordAudit(supabase, actorId, { action: 'hard_delete', targetTable: table, targetId: id });
};
