import { notFound } from 'next/navigation';

import { getPlan, PlanForm } from '@/features/plans';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { Heading } from '@/shared/components/typography/Heading';
import { generatePageMetadata } from '@/shared/config/metadata';

interface EditPlanPageProps {
    params: Promise<{ id: string }>;
}

export const generateMetadata = async ({ params }: EditPlanPageProps) => {
    const { id } = await params;
    return generatePageMetadata(
        {
            slug: `/plans/${id}/edit`,
            title: 'ダイビング予定の編集',
            description: 'ダイビング予定を編集します',
        },
        { noIndex: true },
    );
};

export default async function EditPlanPage({ params }: EditPlanPageProps) {
    const { id } = await params;
    const plan = await getPlan(id);
    if (!plan) notFound();

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs
                breadcrumbs={[
                    { name: 'ダイビング予定', slug: '/plans' },
                    { name: plan.location, slug: `/plans/${id}` },
                    { name: '編集' },
                ]}
            />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                <Heading level={1}>ダイビング予定の編集</Heading>
                <PlanForm
                    planId={id}
                    defaultValues={{ plannedOn: plan.plannedOn, location: plan.location, notes: plan.notes }}
                />
            </div>
        </div>
    );
}
