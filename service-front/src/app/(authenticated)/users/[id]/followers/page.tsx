import { notFound } from 'next/navigation';

import { FollowList, fetchFollowLists, fetchPublicProfile } from '@/features/social';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { generatePageMetadata } from '@/shared/config/metadata';
import { createClient } from '@/shared/lib/supabase/server';

interface FollowersPageProps {
    params: Promise<{ id: string }>;
}

export const generateMetadata = async ({ params }: FollowersPageProps) => {
    const { id } = await params;
    const profile = await fetchPublicProfile(id);
    return generatePageMetadata(
        {
            slug: `/users/${id}/followers`,
            title: profile ? `${profile.nickname} さんのフォロワー` : 'フォロワー',
            description: 'フォロワーのユーザー一覧',
        },
        { noIndex: true },
    );
};

export default async function FollowersPage({ params }: FollowersPageProps) {
    const { id } = await params;
    const profile = await fetchPublicProfile(id);
    if (!profile) notFound();

    const { items } = await fetchFollowLists(id, 'followers');
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs breadcrumbs={[{ name: profile.nickname, slug: `/users/${id}` }, { name: 'フォロワー' }]} />
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8">
                <h1 className="font-semibold text-xl">{profile.nickname} さんのフォロワー</h1>
                <FollowList items={items} currentUserId={user?.id} emptyMessage="まだフォロワーがいません。" />
            </div>
        </div>
    );
}
