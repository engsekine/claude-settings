import { DiveForm } from '@/features/dives';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata(
    {
        slug: '/dives/new',
        title: '新規ダイビングログ',
        description: '新しいダイビングログを記録します',
    },
    { noIndex: true },
);

export default function NewDivePage() {
    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs
                breadcrumbs={[
                    { name: 'ダイビングログ', slug: '/dives' },
                    { name: '新規作成' },
                ]}
            />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                <h1 className="font-semibold text-2xl">新規ダイビングログ</h1>
                <DiveForm />
            </div>
        </div>
    );
}
