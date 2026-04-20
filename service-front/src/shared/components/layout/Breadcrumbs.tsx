import Link from 'next/link';
import { Fragment } from 'react';

import { SITE_NAME, SITE_URL } from '@/shared/constants/site';

export interface BreadcrumbItem {
    slug?: string;
    name: string;
}

interface BreadcrumbsProps {
    breadcrumbs: BreadcrumbItem[];
}

/** JSON-LD 構造化データを生成する */
const generateJsonLd = (breadcrumbs: BreadcrumbItem[]) => {
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
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
            <nav aria-label="パンくずリスト" className="mx-auto w-full max-w-5xl px-4 pt-4">
                <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
                    <li>
                        <Link href="/" className="hover:text-foreground">
                            ホーム
                        </Link>
                    </li>
                    {breadcrumbs.map((breadcrumb) => (
                        <Fragment key={breadcrumb.name}>
                            <li aria-hidden="true">&gt;</li>
                            <li>
                                {breadcrumb.slug !== undefined ? (
                                    <Link href={breadcrumb.slug} className="hover:text-foreground">
                                        {breadcrumb.name}
                                    </Link>
                                ) : (
                                    <span aria-current="page">{breadcrumb.name}</span>
                                )}
                            </li>
                        </Fragment>
                    ))}
                </ol>
            </nav>
        </>
    );
};
