import { TermsContent } from '@/features/terms/components/TermsContent';

export const TermsView = () => {
    return (
        <article className="mx-auto max-w-3xl px-4 py-16">
            <h1 className="mb-10 font-bold text-3xl text-foreground tracking-tight">利用規約</h1>
            <TermsContent />
        </article>
    );
};
