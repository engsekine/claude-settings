import { buttonVariants } from '@repo/ui/components/button';
import Link from 'next/link';

import type { NextPlanSummary } from '@/features/plans/types';

interface NextPlanCardViewProps {
    summary: NextPlanSummary | null;
}

const formatDate = (isoDate: string): string => {
    const [y, m, d] = isoDate.split('-');
    return `${y}/${m}/${d}`;
};

/** 残り日数の表示。色だけに依存せずテキストで伝える（表記は PlanList と統一: あとN日） */
const formatDaysUntil = (daysUntil: number): string => {
    if (daysUntil === 0) return '今日';
    return `あと${daysUntil}日`;
};

const formatPackingProgress = (checkedCount: number, totalCount: number): string => {
    if (totalCount > 0 && checkedCount === totalCount) return '準備完了';
    return `${checkedCount} / ${totalCount} 準備済み`;
};

export const NextPlanCardView = ({ summary }: NextPlanCardViewProps) => {
    if (!summary) {
        return (
            <section
                aria-labelledby="next-plan-heading"
                className="flex flex-col items-start gap-3 rounded-lg border border-border bg-background p-4"
            >
                <h2 id="next-plan-heading" className="font-semibold text-base text-foreground">
                    次の予定
                </h2>
                <p className="text-muted-foreground text-sm">次のダイビングを計画しよう</p>
                <Link href="/plans/new" className={buttonVariants()}>
                    予定を作成する
                </Link>
            </section>
        );
    }

    return (
        <section
            aria-labelledby="next-plan-heading"
            className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50"
        >
            <Link href={`/plans/${summary.id}`} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <h2 id="next-plan-heading" className="font-semibold text-base text-foreground">
                        次の予定
                    </h2>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-primary text-xs">
                        <span className="sr-only">残り日数: </span>
                        {formatDaysUntil(summary.daysUntil)}
                    </span>
                </div>
                <p className="text-muted-foreground text-sm">
                    <span className="sr-only">予定日: </span>
                    {formatDate(summary.plannedOn)}
                </p>
                <p className="font-semibold text-foreground text-lg">{summary.location}</p>
                <p className="text-muted-foreground text-sm">
                    <span className="sr-only">持ち物進捗: </span>
                    {formatPackingProgress(summary.checkedCount, summary.totalCount)}
                </p>
            </Link>
        </section>
    );
};
