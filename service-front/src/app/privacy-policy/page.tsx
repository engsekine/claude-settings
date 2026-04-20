import { PAGE_DATA, PrivacyPolicyView } from '@/features/privacy-policy';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata(PAGE_DATA);

export default function PrivacyPolicyPage() {
    return <PrivacyPolicyView />;
}
