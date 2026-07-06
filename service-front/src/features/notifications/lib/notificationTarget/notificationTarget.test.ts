import { describe, expect, it } from 'vitest';

import { getNotificationTarget } from './notificationTarget';

describe('getNotificationTarget', () => {
    it('followed は /users/{actorId} を返す', () => {
        expect(getNotificationTarget({ type: 'followed', actorId: 'user-1', resourceId: null })).toEqual({
            href: '/users/user-1',
        });
    });

    it('followed で actorId が null（退会）ならリンク無効', () => {
        expect(getNotificationTarget({ type: 'followed', actorId: null, resourceId: null })).toEqual({
            href: null,
        });
    });

    it('buddy_tagged は /dives/{resourceId} を返す', () => {
        expect(getNotificationTarget({ type: 'buddy_tagged', actorId: 'user-1', resourceId: 'dive-1' })).toEqual({
            href: '/dives/dive-1',
        });
    });

    it('buddy_tagged で resourceId が null ならリンク無効', () => {
        expect(getNotificationTarget({ type: 'buddy_tagged', actorId: 'user-1', resourceId: null })).toEqual({
            href: null,
        });
    });

    it('plan_reminder は /plans/{resourceId} を返す', () => {
        expect(getNotificationTarget({ type: 'plan_reminder', actorId: null, resourceId: 'plan-1' })).toEqual({
            href: '/plans/plan-1',
        });
    });

    it('plan_reminder で resourceId が null ならリンク無効', () => {
        expect(getNotificationTarget({ type: 'plan_reminder', actorId: null, resourceId: null })).toEqual({
            href: null,
        });
    });

    it('log_liked は /dives/{resourceId} を返す（spec 027 US3）', () => {
        expect(getNotificationTarget({ type: 'log_liked', actorId: 'user-1', resourceId: 'dive-1' })).toEqual({
            href: '/dives/dive-1',
        });
    });

    it('log_liked で resourceId が null（ログ消滅）ならリンク無効', () => {
        expect(getNotificationTarget({ type: 'log_liked', actorId: 'user-1', resourceId: null })).toEqual({
            href: null,
        });
    });

    it('overhaul_reminder は resourceId によらず /settings/equipment を返す', () => {
        expect(getNotificationTarget({ type: 'overhaul_reminder', actorId: null, resourceId: null })).toEqual({
            href: '/settings/equipment',
        });
        expect(getNotificationTarget({ type: 'overhaul_reminder', actorId: null, resourceId: 'reg-1' })).toEqual({
            href: '/settings/equipment',
        });
    });
});
