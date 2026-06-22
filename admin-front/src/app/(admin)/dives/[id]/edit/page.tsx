import { notFound } from 'next/navigation';

import { DiveEditForm, getDiveDetail } from '@/features/dives-admin';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata({
    slug: '/dives',
    title: 'ダイブログ編集',
    description: 'ダイブログを編集します',
});

export default async function EditDivePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const dive = await getDiveDetail(id);
    if (!dive) notFound();

    return (
        <div className="flex flex-col gap-4">
            <h1 className="font-semibold text-2xl">ダイブログ編集</h1>
            <p className="text-muted-foreground text-sm">ポイント: {dive.location ?? '(サイト参照)'}（編集不可）</p>
            <DiveEditForm
                diveId={dive.id}
                expectedUpdatedAt={dive.updated_at}
                defaultValues={{
                    dive_date: dive.dive_date,
                    max_depth_m: dive.max_depth_m,
                    bottom_time_min: dive.bottom_time_min,
                    buddy_name: dive.buddy_name ?? '',
                    notes: dive.notes ?? '',
                }}
            />
        </div>
    );
}
