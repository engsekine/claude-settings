import type { Route } from 'next';
import Link from 'next/link';

interface FollowCountsProps {
    userId: string;
    followingCount: number;
    followerCount: number;
}

/** フォロー中 / フォロワーの件数（spec 021 FR-016）。各一覧ページへのリンクを兼ねる。 */
export const FollowCounts = ({ userId, followingCount, followerCount }: FollowCountsProps) => (
    <ul className="flex gap-4 text-sm">
        <li>
            <Link href={`/users/${userId}/following` as Route} className="hover:underline">
                <strong>{followingCount}</strong> フォロー中
            </Link>
        </li>
        <li>
            <Link href={`/users/${userId}/followers` as Route} className="hover:underline">
                <strong>{followerCount}</strong> フォロワー
            </Link>
        </li>
    </ul>
);
