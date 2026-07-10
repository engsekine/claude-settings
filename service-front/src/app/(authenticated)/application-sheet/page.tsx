import {
    ApplicationSheetForm,
    getApplicationSheetPrefill,
    PAGE_DATA,
    toSheetDefaultValues,
} from '@/features/application-sheet';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { Heading } from '@/shared/components/typography/Heading';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata(PAGE_DATA, { noIndex: true });

/**
 * 申し込みシート作成ページ（認証必須。未認証は proxy.ts が /login へリダイレクト）。
 * プロフィール・保有資格・ダイブログ・保存済み入力から初期値を組み立てて渡す（FR-007/010）。
 */
export default async function ApplicationSheetPage() {
    const prefill = await getApplicationSheetPrefill();

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs breadcrumbs={[{ name: '申し込みシート' }]} />
            <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8">
                <Heading level={1}>申し込みシート</Heading>
                <p className="text-muted-foreground text-sm">
                    ショップから依頼される定型の記入文をフォーム入力から生成できます。未入力の項目は空欄のまま出力されます。
                </p>
                <ApplicationSheetForm defaultValues={toSheetDefaultValues(prefill)} />
            </div>
        </div>
    );
}
