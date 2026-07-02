import { getCreditBalance } from '@/features/credits/server/queries';

/**
 * ログ枠の残数バッジ（026 / FR-013）。
 * Server Component として残高を直接フェッチし、ログ導線の近傍に置く。
 * 色だけに依存せずテキストで残数を判別できるようにする（a11y）
 */
export const CreditBalanceBadge = async () => {
    const balance = await getCreditBalance();
    const isEmpty = balance === 0;

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-sm ${
                isEmpty ? 'border-amber-300 bg-amber-50 text-amber-900' : 'border-border bg-background text-foreground'
            }`}
        >
            残りログ枠 <span className="font-semibold">{balance}</span>
        </span>
    );
};
