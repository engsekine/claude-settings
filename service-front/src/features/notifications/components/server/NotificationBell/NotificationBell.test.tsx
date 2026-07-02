import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const getUnreadNotificationCount = vi.fn();

vi.mock('@/features/notifications/server/queries', () => ({
    getUnreadNotificationCount: () => getUnreadNotificationCount(),
}));

import { NotificationBell } from './NotificationBell';

describe('NotificationBell', () => {
    beforeEach(() => {
        getUnreadNotificationCount.mockReset();
    });

    it('未読 0 件はバッジを出さず aria-label は「通知」', async () => {
        getUnreadNotificationCount.mockResolvedValue(0);
        render(await NotificationBell());

        const link = screen.getByRole('link', { name: '通知' });
        expect(link).toHaveAttribute('href', '/notifications');
        expect(link).not.toHaveTextContent(/\d/);
    });

    it('未読 3 件はバッジに件数を表示し aria-label に未読数を含める', async () => {
        getUnreadNotificationCount.mockResolvedValue(3);
        render(await NotificationBell());

        const link = screen.getByRole('link', { name: '通知（未読 3 件）' });
        expect(link).toHaveTextContent('3');
    });

    it('未読 12 件（上限超え）はバッジを「9+」に丸める', async () => {
        getUnreadNotificationCount.mockResolvedValue(12);
        render(await NotificationBell());

        const link = screen.getByRole('link', { name: '通知（未読 12 件）' });
        expect(link).toHaveTextContent('9+');
    });
});
