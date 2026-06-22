import { notFound } from 'next/navigation';

import { DiveDetail, diveLocationLabel, getDive, getDivePhotos } from '@/features/dives';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { generatePageMetadata } from '@/shared/config/metadata';

interface DivePageProps {
    params: Promise<{ id: string }>;
}

export const generateMetadata = async ({ params }: DivePageProps) => {
    const { id } = await params;
    return generatePageMetadata(
        {
            slug: `/dives/${id}`,
            title: 'ダイビングログ詳細',
            description: 'ダイビングログの詳細を表示します',
        },
        { noIndex: true },
    );
};

export default async function DivePage({ params }: DivePageProps) {
    const { id } = await params;
    const dive = await getDive(id);
    if (!dive) notFound();

    // 認証ページの詳細は RLS により本人のログのみ表示されるため、本人として写真を管理できる
    const photos = await getDivePhotos(id, `${dive.diveDate} ${dive.location} の写真`);

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs
                breadcrumbs={[{ name: 'ダイビングログ', slug: '/dives' }, { name: diveLocationLabel(dive) }]}
            />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                <DiveDetail dive={dive} photos={photos} canManage />
            </div>
        </div>
    );
}
