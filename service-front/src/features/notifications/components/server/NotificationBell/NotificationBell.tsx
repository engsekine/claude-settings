import { Bell } from 'lucide-react';
import type { Route } from 'next';
import Link from 'next/link';

import { UNREAD_BADGE_MAX } from '@/features/notifications/constants';
import { getUnreadNotificationCount } from '@/features/notifications/server/queries';

/**
 * ヘッダーの通知ベル（025 / FR-004）。
 * 自身で未読件数を取得し、/notifications へのリンクとして表示する Server Component。
 * 未読ありはバッジで件数を示し、UNREAD_BADGE_MAX 超えは「9+」に丸める。
 */
export const NotificationBell = async () => {
    const unreadCount = await getUnreadNotificationCount();

    const label = unreadCount > 0 ? `通知（未読 ${unreadCount} 件）` : '通知';
    const badgeText = unreadCount > UNREAD_BADGE_MAX ? `${UNREAD_BADGE_MAX}+` : `${unreadCount}`;

    return (
        <Link
            href={'/notifications' as Route}
            aria-label={label}
            className="relative inline-flex size-9 items-center justify-center rounded-md transition-colors hover:bg-muted"
        >
            <Bell aria-hidden="true" className="size-5" />
            {unreadCount > 0 && (
                <span
                    aria-hidden="true"
                    className="absolute -top-1 -right-1 inline-flex min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-white text-xs leading-4"
                >
                    {badgeText}
                </span>
            )}
        </Link>
    );
};
