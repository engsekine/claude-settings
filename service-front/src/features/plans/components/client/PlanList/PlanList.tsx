'use client';

import Link from 'next/link';

import { daysUntil } from '@/features/plans/lib/days-until';
import type { Plan } from '@/features/plans/types';

interface PlanListProps {
    plans: Plan[];
    /** JST の今日（YYYY-MM-DD）。サーバー側で todayInJst() を渡す */
    today: string;
}

const formatDate = (isoDate: string): string => {
    const [y, m, d] = isoDate.split('-');
    return `${y}/${m}/${d}`;
};

/** 残り日数の表示文言（0 = 今日、正 = あと N 日） */
const formatDaysUntil = (days: number): string => (days === 0 ? '今日' : `あと${days}日`);

interface PlanCardProps {
    plan: Plan;
    /** 残り日数の表示文言。終了済みの予定は null（残り日数の代わりにバッジを表示する） */
    daysLabel: string | null;
}

const PlanCard = ({ plan, daysLabel }: PlanCardProps) => {
    return (
        <article className="rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50">
            <Link href={`/plans/${plan.id}`} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground text-sm">
                        <span className="sr-only">予定日: </span>
                        {formatDate(plan.plannedOn)}
                    </span>
                    {daysLabel === null ? (
                        <span className="inline-block rounded-md bg-muted px-2 py-0.5 text-muted-foreground text-xs">
                            終了済み
                        </span>
                    ) : (
                        <span className="font-medium text-primary text-sm">{daysLabel}</span>
                    )}
                </div>
                <h3 className="font-semibold text-base text-foreground">{plan.location}</h3>
            </Link>
        </article>
    );
};

export const PlanList = ({ plans, today }: PlanListProps) => {
    // FR-005: 予定日が今日以降を「これから」、過去を「終了済み」に区分して表示する
    const upcomingPlans = plans.filter((plan) => daysUntil(plan.plannedOn, today) >= 0);
    const finishedPlans = plans.filter((plan) => daysUntil(plan.plannedOn, today) < 0);

    // FR-001: 予定 0 件時は作成導線（CTA）を表示する
    if (plans.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border border-dashed bg-background p-12 text-center">
                <p className="text-muted-foreground">予定がまだありません</p>
                <Link
                    href="/plans/new"
                    className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm transition-opacity hover:opacity-90"
                >
                    次のダイビングを計画しよう
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            {upcomingPlans.length > 0 && (
                <section aria-labelledby="upcoming-plans-heading" className="flex flex-col gap-3">
                    <h2 id="upcoming-plans-heading" className="font-semibold text-foreground text-lg">
                        これからの予定
                    </h2>
                    <ul className="flex flex-col gap-3">
                        {upcomingPlans.map((plan) => (
                            <li key={plan.id}>
                                <PlanCard plan={plan} daysLabel={formatDaysUntil(daysUntil(plan.plannedOn, today))} />
                            </li>
                        ))}
                    </ul>
                </section>
            )}

            {finishedPlans.length > 0 && (
                <section aria-labelledby="finished-plans-heading" className="flex flex-col gap-3">
                    <h2 id="finished-plans-heading" className="font-semibold text-foreground text-lg">
                        終了済み
                    </h2>
                    <ul className="flex flex-col gap-3">
                        {finishedPlans.map((plan) => (
                            <li key={plan.id}>
                                <PlanCard plan={plan} daysLabel={null} />
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    );
};
