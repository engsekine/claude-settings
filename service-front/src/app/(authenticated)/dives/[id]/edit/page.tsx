import { notFound } from 'next/navigation';
import type { DiveFormValues } from '@/features/dives';
import { DiveForm, getDive } from '@/features/dives';
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
    const dive = await getDive(id);
    if (!dive) notFound();

    const defaultValues: Partial<DiveFormValues> = {
        diveNumber: dive.diveNumber,
        diveDate: dive.diveDate,
        entryTime: dive.entryTime,
        exitTime: dive.exitTime,
        location: dive.location,
        country: dive.country,
        diveSite: dive.diveSite,
        diveType: dive.diveType,
        weather: dive.weather,
        airTempC: dive.airTempC,
        waterTempC: dive.waterTempC,
        visibilityM: dive.visibilityM,
        wave: dive.wave,
        currentCondition: dive.currentCondition,
        maxDepthM: dive.maxDepthM,
        avgDepthM: dive.avgDepthM,
        bottomTimeMin: dive.bottomTimeMin,
        surfaceIntervalMin: dive.surfaceIntervalMin,
        tankType: dive.tankType,
        tankVolumeL: dive.tankVolumeL,
        gasType: dive.gasType,
        o2Percent: dive.o2Percent,
        pressureStartBar: dive.pressureStartBar,
        pressureEndBar: dive.pressureEndBar,
        weightKg: dive.weightKg,
        suitType: dive.suitType,
        equipmentNotes: dive.equipmentNotes,
        buddyName: dive.buddyName,
        instructorName: dive.instructorName,
        certificationDive: dive.certificationDive,
        notes: dive.notes,
    };

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs
                breadcrumbs={[
                    { name: 'ダイビングログ', slug: '/dives' },
                    { name: dive.diveSite ?? dive.location, slug: `/dives/${id}` },
                    { name: '編集' },
                ]}
            />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                <h1 className="font-semibold text-2xl">ダイビングログ編集</h1>
                <DiveForm diveId={id} defaultValues={defaultValues} />
            </div>
        </div>
    );
}
