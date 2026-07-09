import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SITE_NAME } from '@/shared/constants/site';
import { Header } from './Header';

describe('Header', () => {
    it('ロゴをホームへのリンクとして表示する（サイト名テキストは表示しない）', () => {
        render(<Header />);

        const logoLink = screen.getByRole('link', { name: `${SITE_NAME} ホーム` });
        expect(logoLink).toHaveAttribute('href', '/');
        expect(logoLink).not.toHaveTextContent(SITE_NAME);
    });

    it('メインナビゲーションのリンク（ダイビングログ, いいね）を表示し、ホームのリンクは表示しない', () => {
        render(<Header />);

        const nav = screen.getByRole('navigation', { name: 'メインナビゲーション' });
        expect(nav).toBeInTheDocument();

        expect(screen.queryByRole('link', { name: 'ホーム' })).not.toBeInTheDocument();

        const dives = screen.getByRole('link', { name: 'ダイビングログ' });
        expect(dives).toHaveAttribute('href', '/dives');

        // いいねしたログ一覧への導線（spec 027 FR-008a）
        const likes = screen.getByRole('link', { name: 'いいね' });
        expect(likes).toHaveAttribute('href', '/likes');
    });

    it('SP 用のハンバーガーメニューを開くとナビゲーションリンクを表示する', async () => {
        const user = userEvent.setup();
        render(<Header />);

        await user.click(screen.getByRole('button', { name: 'メニューを開く' }));

        // モーダルシートが開くと背景（デスクトップナビ）は a11y ツリーから外れる
        const sheet = await screen.findByRole('dialog', { name: 'メニュー' });
        expect(within(sheet).getByRole('link', { name: 'ダイビングログ' })).toHaveAttribute('href', '/dives');
        expect(within(sheet).getByRole('link', { name: 'いいね' })).toHaveAttribute('href', '/likes');
    });

    it('actions プロパティで渡された要素を表示する', () => {
        render(<Header actions={<button type="button">ログイン</button>} />);

        expect(screen.getByRole('button', { name: 'ログイン' })).toBeInTheDocument();
    });

    it('actions プロパティが無い場合はハンバーガーメニュー以外のボタンを描画しない', () => {
        render(<Header />);

        expect(screen.getAllByRole('button')).toHaveLength(1);
        expect(screen.getByRole('button', { name: 'メニューを開く' })).toBeInTheDocument();
    });
});
