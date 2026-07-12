import { render, screen } from '@testing-library/react';

import { FollowCounts } from './FollowCounts';

const USER_ID = '22222222-2222-2222-2222-222222222222';

describe('FollowCounts', () => {
    it('件数と一覧ページへのリンクを表示する', () => {
        render(<FollowCounts userId={USER_ID} nickname="buddy-taro" followingCount={3} followerCount={5} />);

        expect(screen.getByRole('link', { name: /3 フォロー中/ })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /5 フォロワー/ })).toBeInTheDocument();
    });

    it('nickname があるとニックネーム URL 基準のリンクになる（034 / FR-003）', () => {
        render(<FollowCounts userId={USER_ID} nickname="buddy-taro" followingCount={0} followerCount={0} />);

        expect(screen.getByRole('link', { name: /フォロー中/ })).toHaveAttribute('href', '/users/buddy-taro/following');
        expect(screen.getByRole('link', { name: /フォロワー/ })).toHaveAttribute('href', '/users/buddy-taro/followers');
    });

    it('nickname 未指定は ID URL にフォールバックする（FR-005）', () => {
        render(<FollowCounts userId={USER_ID} followingCount={0} followerCount={0} />);

        expect(screen.getByRole('link', { name: /フォロー中/ })).toHaveAttribute('href', `/users/${USER_ID}/following`);
    });

    it('URL に使えないニックネームも ID URL にフォールバックする（FR-005）', () => {
        render(<FollowCounts userId={USER_ID} nickname="a/b" followingCount={0} followerCount={0} />);

        expect(screen.getByRole('link', { name: /フォロワー/ })).toHaveAttribute('href', `/users/${USER_ID}/followers`);
    });
});
