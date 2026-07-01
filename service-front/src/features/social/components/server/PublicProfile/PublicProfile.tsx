import type { Route } from 'next';
import Link from 'next/link';

import type { PublicProfile as PublicProfileData, TimelineItem } from '@/features/social/types';
import { formatJstDate } from '@/shared/lib/date';

import { FollowButton } from '../../client/FollowButton';
import { FollowCounts } from '../FollowCounts';

interface PublicProfileProps {
    profile: PublicProfileData;
    /** 対象ユーザーの公開ログ（spec 021 FR-015） */
    publicDives: TimelineItem[];
    /** 閲覧者自身のプロフィールか（自分はフォローボタン非表示） */
    isSelf: boolean;
}

/** 公開プロフィール（spec 021 US3）。表示名・フォロー UI・件数・公開ログ一覧を表示する。 */
export const PublicProfile = ({ profile, publicDives, isSelf }: PublicProfileProps) => (
    <div className="flex flex-col gap-6">
        <header className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
                <h1 className="font-semibold text-2xl">{profile.nickname}</h1>
                {!isSelf && (
                    <FollowButton targetUserId={profile.userId} initialIsFollowing={profile.followState.isFollowing} />
                )}
            </div>
            <FollowCounts
                userId={profile.userId}
                followingCount={profile.followState.followingCount}
                followerCount={profile.followState.followerCount}
            />
        </header>

        <section aria-labelledby="public-profile-dives" className="flex flex-col gap-3">
            <h2 id="public-profile-dives" className="font-semibold text-lg">
                公開ログ
            </h2>
            {publicDives.length === 0 ? (
                <p className="text-muted-foreground text-sm">公開されたログはありません。</p>
            ) : (
                <ul className="flex flex-col divide-y divide-border">
                    {publicDives.map((dive) => (
                        <li key={dive.diveId} className="py-3">
                            <Link
                                href={`/dives/${dive.diveId}` as Route}
                                className="flex items-baseline justify-between gap-3 hover:underline"
                            >
                                <span className="font-medium text-sm">{dive.location}</span>
                                <span className="text-muted-foreground text-sm">{formatJstDate(dive.diveDate)}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    </div>
);
