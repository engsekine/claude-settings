import { describe, expect, it } from 'vitest';

import { isUrlSafeNickname, isUuid, profilePath, RESERVED_USER_SEGMENTS } from './profile-path';

const USER_ID = '000000bd-0000-0000-0000-000000000002';

describe('isUuid', () => {
    it.each([
        '000000bd-0000-0000-0000-000000000002',
        'A1B2C3D4-E5F6-7890-ABCD-EF0123456789', // 大文字も uuid とみなす
    ])('%s は true', (value) => {
        expect(isUuid(value)).toBe(true);
    });

    it.each(['buddy-taro', 'たろう', '12345', 'not-a-uuid-000-000'])('%s は false', (value) => {
        expect(isUuid(value)).toBe(false);
    });
});

describe('isUrlSafeNickname', () => {
    it.each(['buddy-taro', 'たろう', 'Dive Master 田中', 'user_01', '山田+海'])('%s は safe', (value) => {
        expect(isUrlSafeNickname(value)).toBe(true);
    });

    it.each(['a/b', 'a?b', 'a#b', 'a%b', 'a\\b', 'a\nb'])('禁止文字を含む %j は unsafe', (value) => {
        expect(isUrlSafeNickname(value)).toBe(false);
    });

    it.each([
        'search',
        'SEARCH',
        ' Search ',
    ])('予約セグメント %j は unsafe（大文字小文字・前後空白問わず）', (value) => {
        expect(isUrlSafeNickname(value)).toBe(false);
    });

    it('uuid 形式は unsafe（ID との判別を壊すため）', () => {
        expect(isUrlSafeNickname(USER_ID)).toBe(false);
    });

    it('RESERVED_USER_SEGMENTS には search が含まれる', () => {
        expect(RESERVED_USER_SEGMENTS).toContain('search');
    });
});

describe('profilePath', () => {
    it('URL 安全なニックネームはエンコードしたニックネーム URL を返す', () => {
        expect(profilePath({ userId: USER_ID, nickname: 'buddy-taro' })).toBe('/users/buddy-taro');
        expect(profilePath({ userId: USER_ID, nickname: 'たろう' })).toBe(`/users/${encodeURIComponent('たろう')}`);
        expect(profilePath({ userId: USER_ID, nickname: 'Dive Master 田中' })).toBe(
            `/users/${encodeURIComponent('Dive Master 田中')}`,
        );
    });

    it('URL 不可のニックネームは ID URL にフォールバックする（FR-005）', () => {
        expect(profilePath({ userId: USER_ID, nickname: 'a/b' })).toBe(`/users/${USER_ID}`);
        expect(profilePath({ userId: USER_ID, nickname: 'search' })).toBe(`/users/${USER_ID}`);
        expect(profilePath({ userId: USER_ID, nickname: USER_ID })).toBe(`/users/${USER_ID}`);
    });

    it('ニックネーム未指定（null / undefined / 空文字）は ID URL を返す', () => {
        expect(profilePath({ userId: USER_ID })).toBe(`/users/${USER_ID}`);
        expect(profilePath({ userId: USER_ID, nickname: null })).toBe(`/users/${USER_ID}`);
        expect(profilePath({ userId: USER_ID, nickname: '' })).toBe(`/users/${USER_ID}`);
    });
});
