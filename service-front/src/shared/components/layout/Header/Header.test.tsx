import { render, screen } from '@testing-library/react';
import { SITE_NAME } from '@/shared/constants/site';
import { Header } from './Header';

describe('Header', () => {
    it('サイト名をホームへのリンクとして表示する', () => {
        render(<Header />);

        const siteNameLink = screen.getByRole('link', { name: SITE_NAME });
        expect(siteNameLink).toHaveAttribute('href', '/');
    });

    it('メインナビゲーションのリンク（ホーム, ダイビングログ）を表示する', () => {
        render(<Header />);

        const nav = screen.getByRole('navigation', { name: 'メインナビゲーション' });
        expect(nav).toBeInTheDocument();

        const home = screen.getByRole('link', { name: 'ホーム' });
        expect(home).toHaveAttribute('href', '/');

        // 「概要」リンクは /about ページが存在しないデッドリンクだったため削除済み
        expect(screen.queryByRole('link', { name: '概要' })).not.toBeInTheDocument();

        const dives = screen.getByRole('link', { name: 'ダイビングログ' });
        expect(dives).toHaveAttribute('href', '/dives');
    });

    it('actions プロパティで渡された要素を表示する', () => {
        render(<Header actions={<button type="button">ログイン</button>} />);

        expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    });

    it('actions プロパティが無い場合は何も追加描画しない', () => {
        render(<Header />);

        expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
});
