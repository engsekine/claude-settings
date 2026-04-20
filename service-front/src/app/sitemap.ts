import type { MetadataRoute } from 'next';

import { PAGE_DATA as CHAT_PAGE_DATA } from '@/features/chat';
import { PAGE_DATA as PRIVACY_POLICY_PAGE_DATA } from '@/features/privacy-policy';
import { PAGE_DATA as TERMS_PAGE_DATA } from '@/features/terms';
import type { PageMetadata } from '@/shared/config/metadata';
import { SITE_URL } from '@/shared/constants/site';

type SitemapEntry = {
    url: string;
    lastModified: string;
};

const HOME_SITEMAP_DATA: SitemapEntry[] = [
    {
        url: SITE_URL,
        lastModified: new Date().toISOString(),
    },
];

const generateSitemapData = (pages: PageMetadata[]): SitemapEntry[] =>
    pages.map((page) => ({
        url: `${SITE_URL}${page.slug}`,
        lastModified: page.modifiedTime ?? new Date().toISOString(),
    }));

const staticSitemapData = generateSitemapData([
    CHAT_PAGE_DATA,
    PRIVACY_POLICY_PAGE_DATA,
    TERMS_PAGE_DATA,
]);

export default function sitemap(): MetadataRoute.Sitemap {
    return [...HOME_SITEMAP_DATA, ...staticSitemapData];
}
