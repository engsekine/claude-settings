import { notFound } from 'next/navigation';

import { calcSiteStats, DiveSiteDetail, getDiveSiteById, listMyDivesForSite, siteLabel } from '@/features/dive-sites';
import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { generatePageMetadata } from '@/shared/config/metadata';

interface DiveSitePageProps {
    params: Promise<{ id: string }>;
}

export const generateMetadata = async ({ params }: DiveSitePageProps) => {
    const { id } = await params;
    const site = await getDiveSiteById(id);
    return generatePageMetadata(
        {
            slug: `/dive-sites/${id}`,
            title: site ? siteLabel(site) : 'ダイブサイト',
            description: 'ダイブサイトの実績（本数・平均透明度・よく潜る時期）',
        },
        { noIndex: true },
    );
};

export default async function DiveSitePage({ params }: DiveSitePageProps) {
    const { id } = await params;
    const [site, dives] = await Promise.all([getDiveSiteById(id), listMyDivesForSite(id)]);
    if (!site) notFound();

    const stats = calcSiteStats(dives);

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs breadcrumbs={[{ name: 'ダイビングログ', slug: '/dives' }, { name: siteLabel(site) }]} />
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8">
                <DiveSiteDetail site={site} stats={stats} />
            </div>
        </div>
    );
}
