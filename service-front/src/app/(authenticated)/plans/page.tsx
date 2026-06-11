import { buttonVariants } from '@repo/ui/components/button';
import Link from 'next/link';

import { listPlans, PlanList } from '@/features/plans';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { generatePageMetadata } from '@/shared/config/metadata';
import { todayInJst } from '@/shared/lib/date';

export const metadata = generatePageMetadata(
    {
        slug: '/plans',
        title: 'ダイビング予定',
        description: 'あなたのダイビング予定一覧',
    },
    { noIndex: true },
);

export default async function PlansPage() {
    const plans = await listPlans();

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs breadcrumbs={[{ name: 'ダイビング予定' }]} />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
                <div className="flex items-center justify-between">
                    <h1 className="font-semibold text-2xl">ダイビング予定</h1>
                    <Link href="/plans/new" className={buttonVariants({ variant: 'default' })}>
                        予定を作成
                    </Link>
                </div>
                <PlanList plans={plans} today={todayInJst()} />
            </div>
        </div>
    );
}
