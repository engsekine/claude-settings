import Link from 'next/link';
import { notFound } from 'next/navigation';
import { canMovePlanToLog, DeletePlanButton, daysUntil, getPlan, PackingList } from '@/features/plans';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { Heading } from '@/shared/components/typography/Heading';
import { buttonVariants } from '@/shared/components/ui/Button';
import { generatePageMetadata } from '@/shared/config/metadata';
import { formatJstDate, todayInJst } from '@/shared/lib/date';
import { getTidePhase, TIDE_PHASE_LABELS } from '@/shared/lib/tide';

interface PlanPageProps {
    params: Promise<{ id: string }>;
}

export const generateMetadata = async ({ params }: PlanPageProps) => {
    const { id } = await params;
    return generatePageMetadata(
        {
            slug: `/plans/${id}`,
            title: 'ダイビング予定の詳細',
            description: 'ダイビング予定と持ち物リストを表示します',
        },
        { noIndex: true },
    );
};

export default async function PlanPage({ params }: PlanPageProps) {
    const { id } = await params;
    const plan = await getPlan(id);
    if (!plan) notFound();

    const remaining = daysUntil(plan.plannedOn, todayInJst());
    const tidePhase = getTidePhase(plan.plannedOn);

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs breadcrumbs={[{ name: 'ダイビング予定', slug: '/plans' }, { name: plan.location }]} />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                <article className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">
                                <span className="sr-only">予定日: </span>
                                {formatJstDate(plan.plannedOn)}
                            </span>
                            {tidePhase !== null && (
                                <span className="rounded-md bg-muted px-2 py-0.5 text-foreground text-xs">
                                    <span className="sr-only">潮回り: </span>
                                    {TIDE_PHASE_LABELS[tidePhase]}
                                </span>
                            )}
                        </div>
                        {/* バッジは text-muted-foreground だと bg-muted 上でコントラスト AA 未達のため text-foreground を使う */}
                        {remaining < 0 && (
                            <span className="rounded-md bg-muted px-2 py-0.5 text-foreground text-xs">終了済み</span>
                        )}
                        {remaining === 0 && (
                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-primary text-xs">今日</span>
                        )}
                        {remaining > 0 && (
                            <span className="rounded-md bg-primary/10 px-2 py-0.5 text-primary text-xs">
                                あと{remaining}日
                            </span>
                        )}
                    </div>
                    <Heading level={1}>{plan.location}</Heading>
                    {plan.notes && <p className="whitespace-pre-wrap text-muted-foreground text-sm">{plan.notes}</p>}
                    <div className="flex flex-wrap items-center gap-2">
                        {/* 当日以前の予定のみ「ログに記録する」を表示（未来日は非表示 / 024 FR-001,002） */}
                        {canMovePlanToLog(plan.plannedOn, todayInJst()) && (
                            <Link
                                href={`/dives/new?fromPlanId=${plan.id}`}
                                className={buttonVariants({ variant: 'default' })}
                                aria-label={`${plan.location}の予定をログに記録する`}
                            >
                                ログに記録する
                            </Link>
                        )}
                        <Link href={`/plans/${plan.id}/edit`} className={buttonVariants({ variant: 'outline' })}>
                            編集
                        </Link>
                        <DeletePlanButton planId={plan.id} />
                    </div>
                </article>

                <section aria-labelledby="packing-list-heading" className="flex flex-col gap-3">
                    <h2 id="packing-list-heading" className="font-semibold text-lg">
                        持ち物リスト
                    </h2>
                    <PackingList planId={plan.id} items={plan.packingItems} />
                </section>
            </div>
        </div>
    );
}
