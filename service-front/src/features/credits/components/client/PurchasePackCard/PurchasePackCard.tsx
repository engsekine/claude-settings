'use client';

import { Button } from '@repo/ui/components/button';
import { useState, useTransition } from 'react';

import { LOG_CREDIT_PACK } from '@/features/credits/constants';
import { createCheckoutSession } from '@/features/credits/server/actions';

/**
 * ログパックの購入カード（026 / FR-005）。
 * 「購入する」で Checkout Session を作成し、Stripe のホスト型決済ページへ
 * フルページリダイレクトする。価格・数量は表示専用（サーバー定数由来）
 */
export const PurchasePackCard = () => {
    const [isPending, startTransition] = useTransition();
    const [serverError, setServerError] = useState<string | null>(null);

    const handlePurchase = (): void => {
        setServerError(null);
        startTransition(async () => {
            const result = await createCheckoutSession();
            if (!result.success) {
                setServerError(result.error);
                return;
            }
            // Stripe Checkout はホスト型ページのためフルページ遷移する
            window.location.href = result.url;
        });
    };

    return (
        <section
            aria-labelledby="purchase-pack-heading"
            className="flex flex-col gap-3 rounded-lg border border-border bg-background p-6"
        >
            <h2 id="purchase-pack-heading" className="font-semibold text-lg">
                {LOG_CREDIT_PACK.displayName}
            </h2>
            <p className="text-muted-foreground text-sm">
                ログ枠を {LOG_CREDIT_PACK.quantity} 枠まとめて追加できます。買い切りで有効期限はありません。
            </p>
            <p className="font-bold text-2xl">¥{LOG_CREDIT_PACK.amountJpy.toLocaleString('ja-JP')}</p>
            {serverError && (
                <div role="alert" className="text-red-600 text-sm">
                    {serverError}
                </div>
            )}
            <Button type="button" onClick={handlePurchase} disabled={isPending} aria-busy={isPending}>
                {isPending ? '手続きを開始しています...' : '購入する'}
            </Button>
        </section>
    );
};
