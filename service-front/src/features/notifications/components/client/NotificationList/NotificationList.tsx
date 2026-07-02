'use client';

import { Button } from '@repo/ui/components/button';
import type { Route } from 'next';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { DELETED_USER_LABEL, NOTIFICATION_MESSAGES } from '@/features/notifications/constants';
import { getNotificationTarget } from '@/features/notifications/lib/notificationTarget';
import {
    loadMoreNotifications,
    markAllNotificationsRead,
    markNotificationRead,
} from '@/features/notifications/server/actions';
import type { NotificationCursor, NotificationItem } from '@/features/notifications/server/queries';
import { formatJstDate } from '@/shared/lib/date';

interface NotificationListProps {
    /** Server Component（listNotifications）で取得した初回ページ */
    initialItems: NotificationItem[];
    /** 初回ページの次カーソル。null = 次ページなし */
    initialCursor: NotificationCursor | null;
    /** 未読件数（「すべて既読にする」の活性判定に使う） */
    unreadCount: number;
}

/** occurred_at（timestamptz）を JST の暦日に変換して YYYY/MM/DD 表示にする */
const formatOccurredAtJst = (occurredAt: string): string =>
    formatJstDate(new Date(occurredAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Tokyo' }));

/** 通知メッセージを組み立てる（{nickname} は退会時 DELETED_USER_LABEL に落ちる） */
const buildMessage = (item: NotificationItem): string =>
    NOTIFICATION_MESSAGES[item.type].replace('{nickname}', item.actorNickname ?? DELETED_USER_LABEL);

/** actor 退会（nickname 解決不可）のソーシャル通知か。リンク無効化の判定に使う（FR-012） */
const isActorDeleted = (item: NotificationItem): boolean =>
    (item.type === 'followed' || item.type === 'buddy_tagged') && item.actorNickname === null;

/**
 * 通知一覧（025 / US1 / FR-003〜005・FR-012）。
 * タップで既読化してから遷移先へ移動する（既読化の失敗は遷移を妨げない）。
 * 追加ページは keyset カーソルで「さらに読み込む」から取得する。
 */
export const NotificationList = ({ initialItems, initialCursor, unreadCount }: NotificationListProps) => {
    const router = useRouter();
    const [items, setItems] = useState(initialItems);
    const [cursor, setCursor] = useState(initialCursor);
    const [error, setError] = useState<string | null>(null);
    const [isMarkingAll, startMarkingAll] = useTransition();
    const [isLoadingMore, startLoadingMore] = useTransition();

    const handleMarkAllRead = () => {
        setError(null);
        startMarkingAll(async () => {
            const result = await markAllNotificationsRead();
            if (!result.success) {
                setError(result.error);
                return;
            }
            router.refresh();
        });
    };

    const handleItemClick = async (item: NotificationItem, href: string) => {
        /** 既読化の失敗（オフライン等）は遷移を妨げない（contracts/ui-and-routes.md） */
        try {
            await markNotificationRead(item.id);
        } catch (markError) {
            console.error('[NotificationList] 既読化に失敗しました:', markError);
        }
        router.push(href as Route);
    };

    const handleLoadMore = () => {
        if (!cursor) return;
        setError(null);
        startLoadingMore(async () => {
            try {
                const page = await loadMoreNotifications(cursor);
                setItems((prev) => [...prev, ...page.items]);
                setCursor(page.nextCursor);
            } catch (loadError) {
                console.error('[NotificationList] 追加読み込みに失敗しました:', loadError);
                setError('通知の読み込みに失敗しました。時間をおいて再度お試しください');
            }
        });
    };

    return (
        <div className="flex flex-col gap-4">
            <div className="flex justify-end">
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleMarkAllRead}
                    disabled={unreadCount === 0 || isMarkingAll}
                    aria-busy={isMarkingAll}
                >
                    {isMarkingAll ? '既読にしています...' : 'すべて既読にする'}
                </Button>
            </div>

            {error && (
                <p role="alert" className="text-red-600 text-sm">
                    {error}
                </p>
            )}

            {items.length === 0 ? (
                <p className="py-8 text-center text-muted-foreground text-sm">通知はありません</p>
            ) : (
                <ul className="flex flex-col divide-y divide-border">
                    {items.map((item) => {
                        const { href } = getNotificationTarget(item);
                        const isUnread = item.readAt === null;
                        const isClickable = href !== null && !isActorDeleted(item);

                        const content = (
                            <>
                                <span className="flex items-center gap-2">
                                    {isUnread && (
                                        <span className="inline-flex shrink-0 rounded-full border border-red-600 px-1.5 text-red-600 text-xs">
                                            未読
                                        </span>
                                    )}
                                    <span className="text-sm">{buildMessage(item)}</span>
                                </span>
                                <span className="text-muted-foreground text-xs">
                                    {formatOccurredAtJst(item.occurredAt)}
                                </span>
                            </>
                        );

                        return (
                            <li key={item.id} className={isUnread ? 'bg-blue-50' : undefined}>
                                {isClickable ? (
                                    <button
                                        type="button"
                                        onClick={() => handleItemClick(item, href)}
                                        className="flex w-full flex-col items-start gap-1 px-3 py-3 text-left transition-colors hover:bg-muted"
                                    >
                                        {content}
                                    </button>
                                ) : (
                                    <div className="flex w-full flex-col items-start gap-1 px-3 py-3">{content}</div>
                                )}
                            </li>
                        );
                    })}
                </ul>
            )}

            {cursor && (
                <Button
                    type="button"
                    variant="outline"
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    aria-busy={isLoadingMore}
                >
                    {isLoadingMore ? '読み込み中...' : 'さらに読み込む'}
                </Button>
            )}
        </div>
    );
};
