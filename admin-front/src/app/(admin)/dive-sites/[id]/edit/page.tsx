import { notFound } from 'next/navigation';

import { DiveSiteForm, getDiveSiteDetail } from '@/features/dive-sites-admin';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata({
    slug: '/dive-sites',
    title: 'ダイブサイト編集',
    description: 'ダイブサイトを編集します',
});

export default async function EditDiveSitePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const site = await getDiveSiteDetail(id);
    if (!site) notFound();

    return (
        <div className="flex flex-col gap-4">
            <h1 className="font-semibold text-2xl">ダイブサイト編集</h1>
            <DiveSiteForm
                mode="edit"
                siteId={site.id}
                expectedUpdatedAt={site.updated_at}
                defaultValues={{
                    name: site.name,
                    area: site.area ?? '',
                    country: site.country,
                    description: site.description ?? '',
                }}
            />
        </div>
    );
}
