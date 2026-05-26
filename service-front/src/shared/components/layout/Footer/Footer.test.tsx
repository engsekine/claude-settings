import { render, screen } from '@testing-library/react';
import { COPYRIGHT_HOLDER } from '@/shared/constants/site';
import { Footer } from './Footer';

describe('Footer', () => {
    it('フッターナビゲーションをランドマークとして公開する', () => {
        render(<Footer />);

        expect(screen.getByRole('navigation', { name: 'フッターナビゲーション' })).toBeInTheDocument();
    });

    it('基本リンクを表示する', () => {
        render(<Footer />);

        const expectedLinks = [
            { label: 'ホーム', href: '/' },
            { label: 'ダイビングログ', href: '/dives' },
            { label: 'チャット', href: '/chat' },
            { label: '利用規約', href: '/terms' },
            { label: 'プライバシーポリシー', href: '/privacy-policy' },
        ];

        for (const { label, href } of expectedLinks) {
            const link = screen.getByRole('link', { name: label });
            expect(link).toHaveAttribute('href', href);
        }
    });

    it('現在年の著作権表記を表示する', () => {
        render(<Footer />);

        const currentYear = new Date().getFullYear();
        const copyright = screen.getByText(
            new RegExp(`${currentYear}\\s+${COPYRIGHT_HOLDER}\\.\\s+All rights reserved\\.`),
        );
        expect(copyright).toBeInTheDocument();
    });
});
