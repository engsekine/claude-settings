import Link from 'next/link';
import type { NextPlanSummary } from '@/features/plans/types';
import { Heading } from '@/shared/components/typography/Heading';
import { buttonVariants } from '@/shared/components/ui/Button';
import { formatJstDateWithWeekday } from '@/shared/lib/date';
import { getTidePhase, TIDE_PHASE_LABELS } from '@/shared/lib/tide';

import { PackingChecklist } from '../../client/PackingChecklist';

interface NextPlanCardViewProps {
    summary: NextPlanSummary | null;
}

/** 残り日数の表示。色だけに依存せずテキストで伝える（表記は PlanList と統一: あと N 日） */
const formatDaysUntil = (daysUntil: number): string => {
    if (daysUntil === 0) return '今日';
    return `あと ${daysUntil} 日`;
};

export const NextPlanCardView = ({ summary }: NextPlanCardViewProps) => {
    if (!summary) {
        return (
            <section
                aria-labelledby="next-plan-empty-heading"
                className="flex flex-col items-start gap-3 rounded-lg border border-border bg-background p-4"
            >
                {/* app/page.tsx の h2「次のダイビング予定」配下に置かれるため h3 が正しい階層 */}
                <Heading level={3} id="next-plan-empty-heading" className="text-foreground">
                    次の予定
                </Heading>
                <p className="text-muted-foreground text-sm">次のダイビングを計画しよう</p>
                <Link href="/plans/new" className={buttonVariants()}>
                    予定を作成する
                </Link>
            </section>
        );
    }

    const tidePhase = getTidePhase(summary.plannedOn);
    const totalCount = summary.packingItems.length;
    const checkedCount = summary.packingItems.filter((item) => item.isChecked).length;
    const progressPercent = totalCount > 0 ? Math.round((checkedCount / totalCount) * 100) : 0;
    // 複数カードを並べても id が重複しないよう予定 id で修飾する
    const headingId = `next-plan-heading-${summary.id}`;

    return (
        <section aria-labelledby={headingId} className="overflow-hidden rounded-xl border border-border bg-background">
            <div className="grid sm:grid-cols-[1fr_280px]">
                {/* 左ペイン: 予定の概要 */}
                <div className="flex flex-col gap-4 p-5">
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-col gap-1">
                            <p className="flex items-center gap-2 text-muted-foreground text-sm">
                                <span>
                                    <span className="sr-only">予定日: </span>
                                    {formatJstDateWithWeekday(summary.plannedOn)}
                                </span>
                                {/* バッジは text-muted-foreground だと bg-muted 上でコントラスト AA 未達のため text-foreground を使う */}
                                {tidePhase !== null && (
                                    <span className="rounded-md bg-muted px-2 py-0.5 text-foreground text-xs">
                                        <span className="sr-only">潮回り: </span>
                                        {TIDE_PHASE_LABELS[tidePhase]}
                                    </span>
                                )}
                            </p>
                            <Heading level={3} id={headingId} className="text-2xl text-foreground">
                                {summary.location}
                            </Heading>
                        </div>
                        <span className="shrink-0 rounded-full bg-primary px-3 py-1 font-semibold text-primary-foreground text-sm">
                            <span className="sr-only">残り日数: </span>
                            {formatDaysUntil(summary.daysUntil)}
                        </span>
                    </div>
                    {summary.notes && (
                        <p className="whitespace-pre-wrap text-muted-foreground text-sm">{summary.notes}</p>
                    )}
                    <div className="mt-auto flex flex-wrap items-center gap-2">
                        <Link href={`/plans/${summary.id}`} className={buttonVariants({ variant: 'default' })}>
                            予定の詳細
                        </Link>
                        <Link href={`/plans/${summary.id}`} className={buttonVariants({ variant: 'outline' })}>
                            持ち物を準備する
                        </Link>
                    </div>
                </div>

                {/* 右ペイン: 持ち物の準備状況 */}
                <div className="flex flex-col gap-3 border-border border-t bg-muted/40 p-5 sm:border-t-0 sm:border-l">
                    <Heading level={4} className="text-foreground">
                        持ち物の準備
                    </Heading>
                    <p className="font-semibold text-2xl text-foreground">
                        {checkedCount}{' '}
                        <span className="font-normal text-muted-foreground text-sm">/ {totalCount} 準備済み</span>
                    </p>
                    <div
                        role="progressbar"
                        aria-valuenow={checkedCount}
                        aria-valuemin={0}
                        aria-valuemax={totalCount}
                        aria-label="持ち物の準備進捗"
                        className="h-2 w-full overflow-hidden rounded-full bg-border"
                    >
                        {/* 進捗率は動的値のためインライン style を許容（css.md） */}
                        <div className="h-full rounded-full bg-primary" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <PackingChecklist items={summary.packingItems} />
                </div>
            </div>
        </section>
    );
};
