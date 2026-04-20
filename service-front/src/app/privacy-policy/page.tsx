import { PAGE_DATA, PrivacyPolicyView } from '@/features/privacy-policy';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata(PAGE_DATA);

export default function PrivacyPolicyPage() {
    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs breadcrumbs={[{ name: PAGE_DATA.title }]} />
            <PrivacyPolicyView />
        </div>
    );
}
