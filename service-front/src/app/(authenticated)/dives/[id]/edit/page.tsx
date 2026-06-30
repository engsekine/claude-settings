import { notFound } from 'next/navigation';
import { listDiveSites, siteLabel } from '@/features/dive-sites';
import {
    DiveForm,
    diveLocationLabel,
    getDive,
    getDiveBuddies,
    getDivePhotos,
    mapDiveToFormValues,
} from '@/features/dives';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { generatePageMetadata } from '@/shared/config/metadata';

interface EditDivePageProps {
    params: Promise<{ id: string }>;
}

export const generateMetadata = async ({ params }: EditDivePageProps) => {
    const { id } = await params;
    return generatePageMetadata(
        {
            slug: `/dives/${id}/edit`,
            title: 'ダイビングログ編集',
            description: 'ダイビングログを編集します',
        },
        { noIndex: true },
    );
};

export default async function EditDivePage({ params }: EditDivePageProps) {
    const { id } = await params;
    const [dive, sites] = await Promise.all([getDive(id), listDiveSites()]);
    if (!dive) notFound();

    const [photos, buddies] = await Promise.all([
        getDivePhotos(id, `${dive.diveDate} ${diveLocationLabel(dive)} の写真`),
        getDiveBuddies(id),
    ]);
    // 既存バディをフォーム値へ（登録ユーザーは userId、フリーテキストは name）。
    // 編集時に preload しないと保存時の差分同期で全削除されてしまうため必須。
    const buddyValues = buddies.map((buddy) =>
        buddy.isRegistered && buddy.userId ? { userId: buddy.userId } : { name: buddy.name },
    );
    const defaultValues = { ...mapDiveToFormValues(dive), buddies: buddyValues };
    const siteOptions = sites.map((site) => ({ value: site.id, label: siteLabel(site) }));

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs
                breadcrumbs={[
                    { name: 'ダイビングログ', slug: '/dives' },
                    { name: diveLocationLabel(dive), slug: `/dives/${id}` },
                    { name: '編集' },
                ]}
            />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                <h1 className="font-semibold text-2xl">ダイビングログ編集</h1>
                <DiveForm diveId={id} defaultValues={defaultValues} siteOptions={siteOptions} existingPhotos={photos} />
            </div>
        </div>
    );
}
