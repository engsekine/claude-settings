/**
 * 同期エンジンの中核判断（RN 非依存の純粋関数 / contracts/sync-protocol.md）。
 * 実際の DB・通信は engine.ts が担い、ここは「次に何をするか」「結果をどう扱うか」だけを決める。
 */

export type SyncAction = { type: 'transfer'; id: string } | { type: 'done' };

/** 転送待ちキューから次の 1 件を選ぶ（作成順の直列処理） */
export const pickNextTransfer = (pending: Array<{ id: string; created_at: string }>): SyncAction => {
    if (pending.length === 0) return { type: 'done' };
    const sorted = [...pending].sort((a, b) =>
        a.created_at === b.created_at ? a.id.localeCompare(b.id) : a.created_at.localeCompare(b.created_at),
    );
    const next = sorted[0];
    if (!next) return { type: 'done' };
    return { type: 'transfer', id: next.id };
};

export type TransferOutcome = { kind: 'success' } | { kind: 'retry' } | { kind: 'rejected'; message: string };

interface TransferResultInput {
    /** 通信例外などで insert 自体が throw したか（= オフライン・タイムアウト） */
    thrown: boolean;
    errorCode: string | null;
    errorMessage: string | null;
}

/** Postgres ユニーク制約違反（= 転送済みの再送。冪等成功に変換する / FR-005） */
const PG_UNIQUE_VIOLATION = '23505';
/** RLS 違反 */
const PG_INSUFFICIENT_PRIVILEGE = '42501';

/**
 * 転送結果の分類（contracts/sync-protocol.md「1 件の転送シーケンス」）。
 * - success: 完了（cached へ移動して次へ）
 * - retry: 通信起因。pending に戻してエンジンを止め、次のトリガーに委ねる
 * - rejected: サーバー拒否。failed として理由を保存し、手動再転送に委ねる（FR-006）
 */
export const classifyTransferResult = (result: TransferResultInput): TransferOutcome => {
    if (result.thrown) return { kind: 'retry' };
    if (result.errorCode === null && result.errorMessage === null) return { kind: 'success' };
    if (result.errorCode === PG_UNIQUE_VIOLATION) return { kind: 'success' };
    if (result.errorCode === PG_INSUFFICIENT_PRIVILEGE) {
        return { kind: 'rejected', message: '権限がないため転送できませんでした（再ログインをお試しください）' };
    }
    return { kind: 'rejected', message: result.errorMessage ?? '不明なエラーで転送に失敗しました' };
};
