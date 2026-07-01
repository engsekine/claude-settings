import type { Route } from 'next';
import Link from 'next/link';

import { groupTimelineByDate, isTimelineEmpty } from '@/features/social/lib/timeline';
import type { TimelineItem } from '@/features/social/types';
import { formatJstDate } from '@/shared/lib/date';

interface TimelineProps {
    items: TimelineItem[];
}

/**
 * TOP タイムライン（spec 021 US4）。フォロー中ユーザーの公開ログを日付ごとに表示する。
 * 空状態（フォロー 0 / 公開ログ 0）はフォローを促すメッセージを出す。
 */
export const Timeline = ({ items }: TimelineProps) => {
    if (isTimelineEmpty(items)) {
        return (
            <p className="rounded-md border border-border border-dashed bg-muted/30 px-4 py-6 text-center text-muted-foreground text-sm">
                フォロー中のユーザーの公開ログがここに表示されます。気になるダイバーをフォローしてみましょう。
            </p>
        );
    }

    const groups = groupTimelineByDate(items);

    return (
        <ol className="flex flex-col gap-5">
            {groups.map((group) => (
                <li key={group.date} className="flex flex-col gap-2">
                    {/* page.tsx の h2「タイムライン」配下に置かれるため h3 が正しい階層。
                        markuplint のコンポーネント単独解析による見出しスキップ誤検知は .markuplintrc で抑止 */}
                    <h3 className="font-medium text-muted-foreground text-sm">{formatJstDate(group.date)}</h3>
                    <ul className="flex flex-col divide-y divide-border rounded-md border border-border">
                        {group.items.map((dive) => (
                            <li key={dive.diveId} className="flex flex-col gap-1 px-4 py-3">
                                <Link
                                    href={`/dives/${dive.diveId}` as Route}
                                    className="font-medium text-sm hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                                >
                                    {dive.location}
                                </Link>
                                <span className="text-muted-foreground text-xs">
                                    <Link
                                        href={`/users/${dive.ownerId}` as Route}
                                        className="hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
                                    >
                                        {dive.ownerNickname}
                                    </Link>
                                    {' ・ '}最大 {dive.maxDepthM}m ・ {dive.bottomTimeMin}分
                                </span>
                            </li>
                        ))}
                    </ul>
                </li>
            ))}
        </ol>
    );
};
