import type { Metadata } from 'next';

import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/shared/constants/site';

/**
 * 管理画面全体の metadata。
 * 管理画面は検索エンジンに載せないため、常に noindex / nofollow とする。
 */
export const SITE_METADATA: Metadata = {
    title: {
        template: `%s | ${SITE_NAME}`,
        default: SITE_NAME,
    },
    description: SITE_DESCRIPTION,
    metadataBase: new URL(SITE_URL),
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
        },
    },
};

/** ページ単位の metadata 生成に必要な情報 */
export interface PageMetadata {
    slug: string;
    title: string;
    description: string;
}

/**
 * ページ用の metadata を生成する。
 * 管理画面のため常に noindex / nofollow を付与する。
 */
export const generatePageMetadata = (page: PageMetadata): Metadata => ({
    title: page.title,
    description: page.description,
    robots: {
        index: false,
        follow: false,
        nocache: true,
        googleBot: {
            index: false,
            follow: false,
            noimageindex: true,
        },
    },
    alternates: {
        canonical: page.slug,
    },
});
