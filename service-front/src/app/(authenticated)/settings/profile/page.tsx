import { notFound } from 'next/navigation';

import { getProfile, ProfileEditForm } from '@/features/account';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata(
    {
        slug: '/settings/profile',
        title: '会員情報の編集',
        description: '会員情報を編集します',
    },
    { noIndex: true },
);

export default async function ProfileEditPage() {
    const profile = await getProfile();
    if (!profile) notFound();

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs breadcrumbs={[{ name: '会員情報の編集' }]} />
            <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12">
                <h1 className="font-semibold text-2xl">会員情報の編集</h1>
                <ProfileEditForm
                    email={profile.email}
                    defaultValues={{
                        lastName: profile.lastName,
                        firstName: profile.firstName,
                        lastNameRomaji: profile.lastNameRomaji,
                        firstNameRomaji: profile.firstNameRomaji,
                        nickname: profile.nickname,
                        birthOn: profile.birthOn,
                        gender: profile.gender,
                    }}
                />
            </div>
        </div>
    );
}
