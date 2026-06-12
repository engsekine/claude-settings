'use client';

import Link from 'next/link';

import type { DiveListItem } from '@/features/dives/types';
import { getTidePhase, TIDE_PHASE_LABELS } from '@/shared/lib/tide';

interface DiveCardProps {
    dive: DiveListItem;
}

const formatDate = (isoDate: string): string => {
    const [y, m, d] = isoDate.split('-');
    return `${y}/${m}/${d}`;
};

export const DiveCard = ({ dive }: DiveCardProps) => {
    const tidePhase = getTidePhase(dive.diveDate);

    return (
        <article className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50">
            <Link href={`/dives/${dive.id}`} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <span className="text-muted-foreground text-sm">
                            <span className="sr-only">潜水日: </span>
                            {formatDate(dive.diveDate)}
                        </span>
                        {/* バッジは text-muted-foreground だと bg-muted 上でコントラスト AA 未達のため text-foreground を使う */}
                        {tidePhase !== null && (
                            <span className="rounded-md bg-muted px-2 py-0.5 text-foreground text-xs">
                                <span className="sr-only">潮回り: </span>
                                {TIDE_PHASE_LABELS[tidePhase]}
                            </span>
                        )}
                    </div>
                    {dive.diveNumber !== null && (
                        <span className="text-muted-foreground text-xs">
                            <span className="sr-only">ダイブ番号: </span>#{dive.diveNumber}
                        </span>
                    )}
                </div>
                <h2 className="font-semibold text-base text-foreground">{dive.location}</h2>
                <dl className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
                    <div className="flex items-center gap-1">
                        <dt className="font-medium">最大水深</dt>
                        <dd>{dive.maxDepthM}m</dd>
                    </div>
                    <div className="flex items-center gap-1">
                        <dt className="font-medium">潜水時間</dt>
                        <dd>{dive.bottomTimeMin}分</dd>
                    </div>
                    {dive.waterTempC !== null && (
                        <div className="flex items-center gap-1">
                            <dt className="font-medium">水温</dt>
                            <dd>{dive.waterTempC}℃</dd>
                        </div>
                    )}
                    {dive.visibilityM !== null && (
                        <div className="flex items-center gap-1">
                            <dt className="font-medium">透明度</dt>
                            <dd>{dive.visibilityM}m</dd>
                        </div>
                    )}
                </dl>
                {dive.certificationDive && (
                    <span className="inline-block rounded-md bg-primary/10 px-2 py-0.5 text-primary text-xs">
                        講習ダイブ
                    </span>
                )}
            </Link>
        </article>
    );
};
