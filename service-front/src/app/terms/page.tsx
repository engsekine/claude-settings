import { PAGE_DATA, TermsView } from '@/features/terms';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata(PAGE_DATA);

export default function TermsPage() {
    return <TermsView />;
}
