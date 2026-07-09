import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Heading } from '@/shared/components/typography/Heading';
import { buttonVariants } from '@/shared/components/ui/Button';

import { PAGE_DATA } from '../../constants';

/**
 * TOP ダッシュボード末尾に置く使い方ページの導入バナー（030-usage-guide）。
 * 紹介文は使い方ページの PAGE_DATA.description を単一の情報源として流用する。
 */
export const GuideIntroSection = () => {
    return (
        <section aria-labelledby="guide-intro" className="flex flex-col gap-8">
            <div className="flex flex-col items-start gap-4 rounded-xl border border-border bg-background p-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-2">
                    <Heading level={2} id="guide-intro">
                        使い方ガイド
                    </Heading>
                    <p className="text-muted-foreground text-sm">{PAGE_DATA.description}</p>
                </div>
                <Link href="/guide" className={cn(buttonVariants({ variant: 'outline' }), 'shrink-0')}>
                    使い方を見る
                </Link>
            </div>
        </section>
    );
};
