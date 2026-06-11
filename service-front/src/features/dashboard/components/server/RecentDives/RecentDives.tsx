import Link from 'next/link';

import type { RecentDiveItem } from '@/features/dashboard/types';

interface RecentDivesProps {
    /** 直近のダイブログ。表示は先頭 5 件まで（並び順はページ側で保証する） */
    dives: RecentDiveItem[];
}

const MAX_VISIBLE_DIVES = 5;

const formatDate = (isoDate: string): string => {
    const [y, m, d] = isoDate.split('-');
    return `${y}/${m}/${d}`;
};

export const RecentDives = ({ dives }: RecentDivesProps) => {
    if (dives.length === 0) {
        return (
            <div className="flex flex-col items-center gap-3 rounded-lg border border-border border-dashed bg-background p-8 text-center">
                <p className="text-muted-foreground">ログがまだありません</p>
                <Link
                    href="/dives/new"
                    className="rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm transition-opacity hover:opacity-90"
                >
                    最初のログを記録しよう
                </Link>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <ul className="flex flex-col gap-3">
                {dives.slice(0, MAX_VISIBLE_DIVES).map((dive) => (
                    <li key={dive.id}>
                        <Link
                            href={`/dives/${dive.id}`}
                            className="flex flex-col gap-1 rounded-lg border border-border bg-background p-4 transition-colors hover:bg-muted/50"
                        >
                            <span className="text-muted-foreground text-sm">
                                <span className="sr-only">潜水日: </span>
                                {formatDate(dive.diveDate)}
                            </span>
                            <span className="font-semibold text-base text-foreground">{dive.location}</span>
                            <dl className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-sm">
                                <div className="flex items-center gap-1">
                                    <dt className="font-medium">最大水深</dt>
                                    <dd>{dive.maxDepthM}m</dd>
                                </div>
                                <div className="flex items-center gap-1">
                                    <dt className="font-medium">潜水時間</dt>
                                    <dd>{dive.bottomTimeMin}分</dd>
                                </div>
                            </dl>
                        </Link>
                    </li>
                ))}
            </ul>
            <Link href="/dives" className="self-end text-primary text-sm underline-offset-4 hover:underline">
                すべてのログを見る
            </Link>
        </div>
    );
};
