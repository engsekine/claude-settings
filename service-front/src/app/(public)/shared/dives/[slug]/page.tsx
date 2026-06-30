import { notFound } from 'next/navigation';

import { Breadcrumbs } from '@/shared/components/layout/Breadcrumbs';
import { generatePageMetadata } from '@/shared/config/metadata';
import { createClient } from '@/shared/lib/supabase/server';

interface SharedDivePageProps {
    params: Promise<{ slug: string }>;
}

interface PublicDive {
    id: string;
    dive_date: string;
    location: string;
    max_depth_m: number;
    bottom_time_min: number;
    notes: string | null;
    owner_nickname: string;
}

/**
 * 公開ログ 1 件を slug で取得する（spec 021 FR-011）。
 * get_public_dive（SECURITY DEFINER）は is_public=true のみ返すため、
 * 非公開化された slug・未知の slug は 0 行 → null になる。匿名（未ログイン）でも実行可。
 */
const fetchPublicDive = async (slug: string): Promise<PublicDive | null> => {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('get_public_dive', { p_slug: slug });
    if (error) {
        console.error('[shared dive] rpc error:', error);
        return null;
    }
    return data?.[0] ?? null;
};

const formatDate = (isoDate: string): string => {
    const [y, m, d] = isoDate.split('-');
    return `${y}/${m}/${d}`;
};

export const generateMetadata = async ({ params }: SharedDivePageProps) => {
    const { slug } = await params;
    const dive = await fetchPublicDive(slug);
    return generatePageMetadata(
        {
            slug: `/shared/dives/${slug}`,
            title: dive ? `${dive.location} のダイビングログ` : '公開ダイビングログ',
            description: dive
                ? `${dive.owner_nickname} さんが共有したダイビングログ（${formatDate(dive.dive_date)}）`
                : '共有されたダイビングログ',
        },
        { noIndex: true },
    );
};

export default async function SharedDivePage({ params }: SharedDivePageProps) {
    const { slug } = await params;
    const dive = await fetchPublicDive(slug);
    if (!dive) notFound();

    return (
        <div className="flex flex-1 flex-col">
            <Breadcrumbs breadcrumbs={[{ name: '公開ダイビングログ' }]} />
            <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-8">
                <header className="flex flex-col gap-1">
                    <span className="text-muted-foreground text-sm">{formatDate(dive.dive_date)}</span>
                    <h1 className="font-semibold text-2xl">{dive.location}</h1>
                    <p className="text-muted-foreground text-sm">{dive.owner_nickname} さんのログ</p>
                </header>

                <dl className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1">
                        <dt className="font-medium text-sm">最大水深</dt>
                        <dd className="text-sm">{dive.max_depth_m} m</dd>
                    </div>
                    <div className="flex flex-col gap-1">
                        <dt className="font-medium text-sm">潜水時間</dt>
                        <dd className="text-sm">{dive.bottom_time_min} 分</dd>
                    </div>
                </dl>

                {dive.notes && (
                    <section className="flex flex-col gap-1">
                        <h2 className="font-medium text-sm">メモ・印象</h2>
                        <p className="whitespace-pre-wrap rounded-md border border-border bg-background px-3 py-2 text-sm">
                            {dive.notes}
                        </p>
                    </section>
                )}
            </div>
        </div>
    );
}
