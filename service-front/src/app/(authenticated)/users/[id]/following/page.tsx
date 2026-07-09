import { notFound } from 'next/navigation';

import { FollowList, fetchFollowLists, fetchPublicProfile } from '@/features/social';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { Heading } from '@/shared/components/typography/Heading';
import { generatePageMetadata } from '@/shared/config/metadata';
import { createClient } from '@/shared/lib/supabase/server';

interface FollowingPageProps {
    params: Promise<{ id: string }>;
}

export const generateMetadata = async ({ params }: FollowingPageProps) => {
    const { id } = await params;
    const profile = await fetchPublicProfile(id);
    return generatePageMetadata(
        {
            slug: `/users/${id}/following`,
            title: profile ? `${profile.nickname} さんのフォロー中` : 'フォロー中',
            description: 'フォロー中のユーザー一覧',
        },
        { noIndex: true },
    );
};

export default async function FollowingPage({ params }: FollowingPageProps) {
    const { id } = await params;
    const profile = await fetchPublicProfile(id);
    if (!profile) notFound();

    const { items } = await fetchFollowLists(id, 'following');
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs breadcrumbs={[{ name: profile.nickname, slug: `/users/${id}` }, { name: 'フォロー中' }]} />
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 px-4 py-8">
                <Heading level={1}>{profile.nickname} さんのフォロー中</Heading>
                <FollowList items={items} currentUserId={user?.id} emptyMessage="まだ誰もフォローしていません。" />
            </div>
        </div>
    );
}
