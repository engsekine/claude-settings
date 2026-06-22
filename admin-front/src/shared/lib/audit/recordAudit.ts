import type { Database } from '@repo/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

type AdminClient = SupabaseClient<Database>;

export type AuditAction = 'create' | 'update' | 'soft_delete' | 'hard_delete' | 'restore';

export interface AuditEntry {
    action: AuditAction;
    targetTable: string;
    targetId: string;
    /** 変更差分の要約（before/after）。個人情報・パスワード等は記録しない */
    changes?: Record<string, unknown> | null;
}

/**
 * 監査ログを 1 件記録する（FR-018 / contracts/admin-audit.md）。
 * actor_id はサーバーで解決した管理者 ID を使う（クライアント指定を信頼しない）。
 * 記録に失敗した場合は throw し、呼び出し側の mutation 全体を失敗扱いにする
 * （監査なしの変更を残さない）。
 */
export const recordAudit = async (supabase: AdminClient, actorId: string, entry: AuditEntry): Promise<void> => {
    // changes は任意の JSON 形（Record<string, unknown>）のため、生成された Json 型との
    // 境界をここで閉じ込める（値は呼び出し側で個人情報を含めない方針）。
    // biome-ignore lint/suspicious/noExplicitAny: 監査ログ changes(JSON) の型境界
    const { error } = await (supabase as any).from('admin_audit_logs').insert({
        actor_id: actorId,
        action: entry.action,
        target_table: entry.targetTable,
        target_id: entry.targetId,
        changes: entry.changes ?? null,
    });
    if (error) throw error;
};
