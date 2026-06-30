import { notFound } from 'next/navigation';

import { fetchPublicProfile, fetchUserPublicDives, PublicProfile } from '@/features/social';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { generatePageMetadata } from '@/shared/config/metadata';
import { createClient } from '@/shared/lib/supabase/server';

interface ProfilePageProps {
    params: Promise<{ id: string }>;
}

export const generateMetadata = async ({ params }: ProfilePageProps) => {
    const { id } = await params;
    const profile = await fetchPublicProfile(id);
    return generatePageMetadata(
        {
            slug: `/users/${id}`,
            title: profile ? `${profile.nickname} さんのプロフィール` : 'プロフィール',
            description: profile ? `${profile.nickname} さんの公開ログとフォロー情報` : 'ユーザープロフィール',
        },
        { noIndex: true },
    );
};

export default async function ProfilePage({ params }: ProfilePageProps) {
    const { id } = await params;
    const profile = await fetchPublicProfile(id);
    if (!profile) notFound();

    const publicDives = await fetchUserPublicDives(id);
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    const isSelf = user?.id === id;

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs breadcrumbs={[{ name: profile.nickname }]} />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                <PublicProfile profile={profile} publicDives={publicDives.items} isSelf={isSelf} />
            </div>
        </div>
    );
}
