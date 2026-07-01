import { notFound } from 'next/navigation';

import { DiveDetail, diveLocationLabel, getDive, getDiveBuddies, getDivePhotos } from '@/features/dives';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { generatePageMetadata } from '@/shared/config/metadata';
import { createClient } from '@/shared/lib/supabase/server';

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

    // 公開ログは RLS により他人のログも取得できるため、所有者本人のときのみ管理（編集・削除・公開設定）を許可する
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const canManage = dive.userId === user?.id;

    const photos = await getDivePhotos(id, `${dive.diveDate} ${dive.location} の写真`);
    const buddies = await getDiveBuddies(id);

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs
                breadcrumbs={[{ name: 'ダイビングログ', slug: '/dives' }, { name: diveLocationLabel(dive) }]}
            />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                <DiveDetail dive={dive} photos={photos} buddies={buddies} canManage={canManage} />
            </div>
        </div>
    );
}
