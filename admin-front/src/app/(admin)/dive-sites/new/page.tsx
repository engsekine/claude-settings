import { DiveSiteForm } from '@/features/dive-sites-admin';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata({
    slug: '/dive-sites/new',
    title: 'ダイブサイト新規作成',
    description: 'ダイブサイトを新規作成します',
});

export default function NewDiveSitePage() {
    return (
        <div className="flex flex-col gap-4">
            <h1 className="font-semibold text-2xl">ダイブサイト新規作成</h1>
            <DiveSiteForm mode="create" />
        </div>
    );
}
