import { PlanForm } from '@/features/plans';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { Heading } from '@/shared/components/typography/Heading';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata(
    {
        slug: '/plans/new',
        title: 'ダイビング予定の作成',
        description: '新しいダイビング予定を作成します',
    },
    { noIndex: true },
);

export default function NewPlanPage() {
    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs breadcrumbs={[{ name: 'ダイビング予定', slug: '/plans' }, { name: '作成' }]} />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                <Heading level={1}>ダイビング予定の作成</Heading>
                <PlanForm />
            </div>
        </div>
    );
}
