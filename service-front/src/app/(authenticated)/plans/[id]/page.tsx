import { buttonVariants } from '@repo/ui/components/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { DeletePlanButton, daysUntil, getPlan, PackingList } from '@/features/plans';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { generatePageMetadata } from '@/shared/config/metadata';
import { todayInJst } from '@/shared/lib/date';

interface PlanPageProps {
    params: Promise<{ id: string }>;
}

const formatDate = (isoDate: string): string => {
    const [y, m, d] = isoDate.split('-');
    return `${y}/${m}/${d}`;
};

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

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs breadcrumbs={[{ name: 'ダイビング予定', slug: '/plans' }, { name: plan.location }]} />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                <article className="flex flex-col gap-3 rounded-lg border border-border bg-background p-4">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground text-sm">
                            <span className="sr-only">予定日: </span>
                            {formatDate(plan.plannedOn)}
                        </span>
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
                    <h1 className="font-semibold text-2xl text-foreground">{plan.location}</h1>
                    {plan.notes && <p className="whitespace-pre-wrap text-muted-foreground text-sm">{plan.notes}</p>}
                    <div className="flex items-center gap-2">
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
