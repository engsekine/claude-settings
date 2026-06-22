import { buttonVariants } from '@repo/ui/components/button';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { getDiveDetail } from '@/features/dives-admin';
import { generatePageMetadata } from '@/shared/config/metadata';

export const metadata = generatePageMetadata({
    slug: '/dives',
    title: 'ダイブログ詳細',
    description: 'ダイブログの詳細情報',
});

export default async function DiveDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const dive = await getDiveDetail(id);
    if (!dive) notFound();

    const rows: { label: string; value: string }[] = [
        { label: '潜水日', value: dive.dive_date },
        { label: 'ポイント', value: dive.location ?? '(サイト参照)' },
        { label: '最大水深(m)', value: String(dive.max_depth_m) },
        { label: '潜水時間(分)', value: String(dive.bottom_time_min) },
        { label: 'バディ', value: dive.buddy_name ?? '-' },
        { label: 'メモ', value: dive.notes ?? '-' },
        { label: '記録日', value: new Date(dive.created_at).toLocaleString('ja-JP') },
    ];

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
                <h1 className="font-semibold text-2xl">ダイブログ詳細</h1>
                <Link href={`/dives/${dive.id}/edit`} className={buttonVariants({ variant: 'outline' })}>
                    編集
                </Link>
            </div>
            <dl className="grid max-w-xl grid-cols-[12rem_1fr] gap-y-2 text-sm">
                {rows.map((row) => (
                    <div key={row.label} className="contents">
                        <dt className="font-medium text-muted-foreground">{row.label}</dt>
                        <dd className="whitespace-pre-wrap">{row.value}</dd>
                    </div>
                ))}
            </dl>
        </div>
    );
}
