import { notFound } from 'next/navigation';

import { ProfileEditForm, getProfile } from '@/features/account';
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
        <div className="mx-auto flex w-full max-w-xl flex-col gap-6 px-4 py-12">
            <h1 className="text-2xl font-semibold">会員情報の編集</h1>
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
    );
}
