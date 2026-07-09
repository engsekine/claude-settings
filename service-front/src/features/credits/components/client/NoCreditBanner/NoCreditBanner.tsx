'use client';

import Link from 'next/link';
import { buttonVariants } from '@/shared/components/ui/Button';

interface NoCreditBannerProps {
    /**
     * 購入ページ（/settings/log-credits）への導線を表示するか。
     * US1 単独リリース時はページが未提供のため false にする（026 / analyze G1）
     */
    showPurchaseLink?: boolean;
}

/**
 * 残枠 0 でログを作成できないときの案内バナー（026 / FR-002）。
 * role="alert" で支援技術へ即時通知し、デイリーボーナスの回復手段と
 * 購入導線（有効時）を提示する。
 */
export const NoCreditBanner = ({ showPurchaseLink = true }: NoCreditBannerProps) => {
    return (
        <div role="alert" className="flex flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
            <p className="font-semibold text-amber-900">ログ枠がありません</p>
            <p className="text-amber-800 text-sm">
                ログ枠は毎日 1 つ自動で追加されます。
                {showPurchaseLink && '今すぐ記録するにはログパックを購入してください。'}
            </p>
            {showPurchaseLink && (
                <Link href="/settings/log-credits" className={buttonVariants({ variant: 'outline', size: 'sm' })}>
                    ログパックを購入（10 枠 / ¥300）
                </Link>
            )}
        </div>
    );
};
