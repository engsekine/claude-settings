import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@repo/ui/components/breadcrumb';
import type { Route } from 'next';
import Link from 'next/link';

import { SITE_NAME, SITE_URL } from '@/shared/constants/site';

export interface BreadcrumbEntry {
    /** 遷移先パス。動的セグメント（`/plans/${id}` 等）を含むため Route 型ではなく string で受ける */
    slug?: string;
    name: string;
}

interface BreadcrumbsProps {
    breadcrumbs: BreadcrumbEntry[];
}

/** JSON-LD 構造化データを生成する */
const generateJsonLd = (breadcrumbs: BreadcrumbEntry[]) => {
    const items = [
        { '@type': 'ListItem' as const, position: 1, name: SITE_NAME, item: `${SITE_URL}/` },
        ...breadcrumbs.map((breadcrumb, index) => {
            const isLastItem = index === breadcrumbs.length - 1;
            return {
                '@type': 'ListItem' as const,
                position: index + 2,
                name: breadcrumb.name,
                ...(isLastItem ? {} : { item: `${SITE_URL}${breadcrumb.slug}` }),
            };
        }),
    ];

    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items,
    };
};

export const Breadcrumbs = ({ breadcrumbs }: BreadcrumbsProps) => {
    const jsonLd = generateJsonLd(breadcrumbs);

    return (
        <>
            <script
                type="application/ld+json"
                // biome-ignore lint/security/noDangerouslySetInnerHtml: <JSON-LD 構造化データの埋め込みは React の標準的なパターンであり、JSON.stringify でエスケープ済みのため XSS リスクはない>
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <Breadcrumb aria-label="パンくずリスト" className="mx-auto w-full max-w-5xl px-4 pt-4">
                <BreadcrumbList>
                    <BreadcrumbItem>
                        <BreadcrumbLink render={<Link href="/" />}>ホーム</BreadcrumbLink>
                    </BreadcrumbItem>
                    {breadcrumbs.flatMap((breadcrumb) => [
                        <BreadcrumbSeparator key={`sep-${breadcrumb.name}`} />,
                        <BreadcrumbItem key={breadcrumb.name}>
                            {breadcrumb.slug !== undefined ? (
                                <BreadcrumbLink render={<Link href={breadcrumb.slug as Route} />}>
                                    {breadcrumb.name}
                                </BreadcrumbLink>
                            ) : (
                                <BreadcrumbPage>{breadcrumb.name}</BreadcrumbPage>
                            )}
                        </BreadcrumbItem>,
                    ])}
                </BreadcrumbList>
            </Breadcrumb>
        </>
    );
};
